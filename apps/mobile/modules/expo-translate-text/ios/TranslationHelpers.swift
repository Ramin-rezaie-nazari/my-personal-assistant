import Foundation
#if canImport(Translation)
import Translation
#endif
import SwiftUI

enum InputType { case string, array, dictionary }
typealias DictMapping = [String: (isArray: Bool, indices: [Int])]

func parseTexts(from params: [String: Any]) -> (texts: [String], inputType: InputType, dictMapping: DictMapping?) {
  if let text = params["input"] as? String { return ([text], .string, nil) }
  if let textsArray = params["input"] as? [String] { return (textsArray, .array, nil) }
  if let textsDict = params["input"] as? [String: Any] {
    var mapping: DictMapping = [:]
    var allTexts: [String] = []
    for (key, value) in textsDict {
      if let str = value as? String {
        mapping[key] = (false, [allTexts.count]); allTexts.append(str)
      } else if let strArray = value as? [String] {
        let startIndex = allTexts.count; allTexts.append(contentsOf: strArray)
        mapping[key] = (true, Array(startIndex..<startIndex + strArray.count))
      }
    }
    return (allTexts, .dictionary, mapping)
  }
  return ([], .array, nil)
}

@available(iOS 18.0, *)
func friendlyErrorMessage(from error: Error) -> String {
  if let translationError = error as? TranslationError { return translationError.errorDescription ?? "A translation error occurred." }
  return error.localizedDescription
}

@available(iOS 18.0, *)
@MainActor
func makeConfiguration(from props: Props) -> TranslationSession.Configuration {
  TranslationSession.Configuration(source: props.sourceLanguage.map { Locale.Language(identifier: $0) }, target: props.targetLanguage.map { Locale.Language(identifier: $0) })
}
