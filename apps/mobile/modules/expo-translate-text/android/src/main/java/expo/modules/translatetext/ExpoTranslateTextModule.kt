package expo.modules.translatetext

import android.os.Build
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.languageid.LanguageIdentification
import com.google.mlkit.nl.languageid.LanguageIdentificationOptions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import java.util.concurrent.atomic.AtomicInteger

class ExpoTranslateTextModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoTranslateText")

    Function("isTranslationSupported") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return@Function false
      val context = appContext.reactContext ?: return@Function false
      val availability = GoogleApiAvailability.getInstance()
      return@Function availability.isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS
    }

    AsyncFunction("translateTask") { inputJson: String, targetLangCode: String, sourceLangCode: String?, requiresWifi: Boolean, requireCharging: Boolean, promise: Promise ->
      translateTask(inputJson, targetLangCode, sourceLangCode, requiresWifi, requireCharging, promise)
    }
  }

  private fun translateTask(inputJson: String, targetLangCode: String, sourceLangCode: String?, requiresWifi: Boolean, requireCharging: Boolean, promise: Promise) {
    try {
      val textsInput = JSONTokener(inputJson).nextValue()
      val targetLanguage = TranslateLanguage.fromLanguageTag(targetLangCode)
        ?: throw CodedException("INVALID_PARAMETER", "Invalid target language: $targetLangCode", null)
      val fixedSourceLanguage = if (sourceLangCode != null && sourceLangCode != "auto") {
        TranslateLanguage.fromLanguageTag(sourceLangCode)
          ?: throw CodedException("INVALID_PARAMETER", "Invalid source language: $sourceLangCode", null)
      } else null

      val conditionsBuilder = DownloadConditions.Builder()
      if (requiresWifi) conditionsBuilder.requireWifi()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && requireCharging) conditionsBuilder.requireCharging()
      val conditions = conditionsBuilder.build()
      val textsMap = extractTexts(textsInput)
      var translatedTexts = buildInitialOutputStructure(textsInput)
      val detectedLanguages = mutableMapOf<String, String>()
      val languageIdentifier = LanguageIdentification.getClient(LanguageIdentificationOptions.Builder().setConfidenceThreshold(0.5f).build())
      val translators = mutableMapOf<String, com.google.mlkit.nl.translate.Translator>()
      val totalStringCount = textsMap.values.sumOf { it.size }
      val pendingCountValue = if (fixedSourceLanguage != null) totalStringCount * 2 + 1 else totalStringCount * 3
      val pendingCount = AtomicInteger(pendingCountValue)

      val completionHandler: () -> Unit = {
        val remaining = pendingCount.decrementAndGet()
        if (remaining == 0) {
          translators.values.forEach { it.close() }
          languageIdentifier.close()
          val uniqueLangs = detectedLanguages.values.toSet()
          val finalSourceLanguage = if (fixedSourceLanguage != null) fixedSourceLanguage else if (uniqueLangs.size == 1) uniqueLangs.first() else "multiple"
          promise.resolve(mapOf("translatedTexts" to translatedTexts, "detectedLanguages" to detectedLanguages, "targetLanguage" to targetLangCode, "sourceLanguage" to finalSourceLanguage))
        } else if (remaining < 0) {
          translators.values.forEach { it.close() }
          languageIdentifier.close()
          promise.reject(CodedException("INTERNAL_ERROR", "Task count went negative: $remaining", null))
        }
      }

      val translateText: (String, String, String) -> Unit = { key, text, sourceLang ->
        val translatorKey = "$sourceLang-$targetLanguage"
        val translator = translators.getOrPut(translatorKey) {
          Translation.getClient(TranslatorOptions.Builder().setSourceLanguage(sourceLang).setTargetLanguage(targetLanguage).build())
        }
        translator.downloadModelIfNeeded(conditions)
          .addOnSuccessListener {
            completionHandler()
            translator.translate(text)
              .addOnSuccessListener { translatedText ->
                synchronized(translatedTexts) {
                  when (translatedTexts) {
                    is String -> translatedTexts = translatedText
                    is MutableList<*> -> (translatedTexts as MutableList<String>).add(translatedText)
                    is MutableMap<*, *> -> {
                      val existingValue = (translatedTexts as MutableMap<String, Any>)[key]
                      when (existingValue) {
                        is String -> (translatedTexts as MutableMap<String, Any>)[key] = translatedText
                        is MutableList<*> -> (existingValue as MutableList<String>).add(translatedText)
                      }
                    }
                  }
                  detectedLanguages[key] = sourceLang
                }
                completionHandler()
              }
              .addOnFailureListener { e ->
                translators.values.forEach { it.close() }
                languageIdentifier.close()
                promise.reject(CodedException("TEXT_TRANSLATE_FAILED", e.message ?: "Translation failed for text: $text", e))
              }
          }
          .addOnFailureListener { e ->
            translators.values.forEach { it.close() }
            languageIdentifier.close()
            promise.reject(CodedException("MODEL_DOWNLOAD_FAILED", e.message ?: "Model download failed for $sourceLang-$targetLanguage", e))
          }
      }

      val processTexts: () -> Unit = {
        if (textsMap.isEmpty()) {
          completionHandler()
        } else {
          for ((key, listOfStrings) in textsMap) {
            for (singleString in listOfStrings) {
              if (fixedSourceLanguage != null) {
                translateText(key, singleString, fixedSourceLanguage)
              } else {
                languageIdentifier.identifyLanguage(singleString)
                  .addOnSuccessListener { langCode ->
                    completionHandler()
                    val detectedLangCode = if (langCode == "und") "en" else langCode
                    val sourceLang = TranslateLanguage.fromLanguageTag(detectedLangCode) ?: "en"
                    translateText(key, singleString, sourceLang)
                  }
                  .addOnFailureListener { e ->
                    translators.values.forEach { it.close() }
                    languageIdentifier.close()
                    promise.reject(CodedException("LANGUAGE_ID_FAILED", e.message ?: "Language identification failed for text: $singleString", e))
                  }
              }
            }
          }
        }
      }

      if (fixedSourceLanguage != null) {
        val translator = Translation.getClient(TranslatorOptions.Builder().setSourceLanguage(fixedSourceLanguage).setTargetLanguage(targetLanguage).build())
        translators["fixed"] = translator
        translator.downloadModelIfNeeded(conditions)
          .addOnSuccessListener { completionHandler(); processTexts() }
          .addOnFailureListener { e ->
            translators.values.forEach { it.close() }
            languageIdentifier.close()
            promise.reject(CodedException("MODEL_DOWNLOAD_FAILED", e.message ?: "Model download failed", e))
          }
      } else {
        processTexts()
      }
    } catch (e: CodedException) {
      promise.reject(e)
    } catch (e: Exception) {
      promise.reject(CodedException("PARAMETER_ERROR", e.message ?: "Unknown error", e))
    }
  }

  private fun extractTexts(input: Any): Map<String, List<String>> = when (input) {
    is String -> mapOf("0" to listOf(input))
    is JSONArray -> {
      val list = mutableListOf<String>(); for (i in 0 until input.length()) list.add(input.getString(i)); mapOf("0" to list)
    }
    is JSONObject -> {
      val result = mutableMapOf<String, List<String>>(); val keys = input.keys()
      while (keys.hasNext()) {
        val key = keys.next(); val value = input.get(key)
        result[key] = when (value) {
          is String -> listOf(value)
          is JSONArray -> { val list = mutableListOf<String>(); for (i in 0 until value.length()) list.add(value.getString(i)); list }
          else -> emptyList()
        }
      }
      result
    }
    else -> emptyMap()
  }

  private fun buildInitialOutputStructure(input: Any): Any = when (input) {
    is String -> ""
    is JSONArray -> mutableListOf<String>()
    is JSONObject -> {
      val output = mutableMapOf<String, Any>(); val keys = input.keys()
      while (keys.hasNext()) {
        val key = keys.next(); val value = input.get(key)
        output[key] = when (value) { is String -> ""; is JSONArray -> mutableListOf<String>(); else -> "" }
      }
      output
    }
    else -> ""
  }
}
