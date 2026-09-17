import ExpoModulesCore
import SwiftUI
#if canImport(Translation)
import Translation
#endif

public class ExpoTranslateTextModule: Module {
    private var hostingController: UIHostingController<AnyView>?

    public func definition() -> ModuleDefinition {
        Name("ExpoTranslateText")

        Function("isTranslationSupported") { () -> Bool in
            if #available(iOS 18.0, *) { return true }
            return false
        }

        AsyncFunction("translateSheet") { [weak self] (params: [String: Any]) async throws -> [String: Any] in
            guard let self = self else { throw NSError(domain: "ExpoIosTranslateModule", code: 0, userInfo: [NSLocalizedDescriptionKey: "Module deallocated"]) }
            let textToTranslate = (params["input"] as? String) ?? ""
            guard !textToTranslate.isEmpty else { throw NSError(domain: "ExpoIosTranslateModule", code: 3, userInfo: [NSLocalizedDescriptionKey: "No text provided for translation"]) }
            let sheetProps = SheetProps()
            sheetProps.text = textToTranslate
            if #available(iOS 17.4, *) {
                return try await withCheckedThrowingContinuation { continuation in
                    DispatchQueue.main.async {
                        sheetProps.onHide = {
                            continuation.resume(returning: ["translatedText": sheetProps.text])
                            self.dismissTranslationView()
                        }
                        sheetProps.isPresented = true
                        self.presentTranslationSheet(sheetProps)
                    }
                }
            }
            throw NSError(domain: "ExpoIosTranslateModule", code: -1, userInfo: [NSLocalizedDescriptionKey: "Translation sheet is only supported on iOS 17.4 or newer"])
        }

        AsyncFunction("translateTask") { [weak self] (params: [String: Any]) async throws -> [String: Any] in
            guard let self = self else { throw NSError(domain: "ExpoIosTranslateModule", code: 0, userInfo: [NSLocalizedDescriptionKey: "Module deallocated"]) }
            let (texts, inputType, dictMapping) = parseTexts(from: params)
            guard !texts.isEmpty else { throw NSError(domain: "ExpoIosTranslateModule", code: 3, userInfo: [NSLocalizedDescriptionKey: "No texts provided for translation"]) }
            let targetLangCode = params["targetLangCode"] as? String ?? "en"
            let sourceLangCode = params["sourceLangCode"] as? String
            let props = Props()
            props.texts = texts
            props.targetLanguage = targetLangCode
            props.sourceLanguage = sourceLangCode

            if #available(iOS 18.0, *) {
                await MainActor.run { self.presentTranslationView(props) }
                return try await withCheckedThrowingContinuation { continuation in
                    props.onSuccess = { translatedTexts, detectedSourceLanguage in
                        let finalSourceLanguage = detectedSourceLanguage ?? sourceLangCode
                        let result: [String: Any]
                        if inputType == .dictionary, let mapping = dictMapping {
                            var resultDict: [String: Any] = [:]
                            for (key, value) in mapping {
                                if value.isArray {
                                    resultDict[key] = value.indices.map { translatedTexts[$0] }
                                } else if let index = value.indices.first {
                                    resultDict[key] = translatedTexts[index]
                                }
                            }
                            result = ["translatedTexts": resultDict, "sourceLanguage": finalSourceLanguage as Any, "targetLanguage": targetLangCode]
                        } else if inputType == .string {
                            result = ["translatedTexts": translatedTexts.first ?? "", "sourceLanguage": finalSourceLanguage as Any, "targetLanguage": targetLangCode]
                        } else {
                            result = ["translatedTexts": translatedTexts, "sourceLanguage": finalSourceLanguage as Any, "targetLanguage": targetLangCode]
                        }
                        continuation.resume(returning: result)
                        DispatchQueue.main.async { self.dismissTranslationView() }
                    }
                    props.onError = { errorMessage in
                        continuation.resume(throwing: NSError(domain: "ExpoIosTranslateModule", code: 2, userInfo: [NSLocalizedDescriptionKey: errorMessage]))
                        DispatchQueue.main.async { self.dismissTranslationView() }
                    }
                    props.shouldTranslate = true
                }
            }
            throw NSError(domain: "ExpoIosTranslateModule", code: -1, userInfo: [NSLocalizedDescriptionKey: "Translation is only supported on iOS 18.0 or newer"])
        }
    }

    @MainActor private func presentTranslationView(_ props: Props) {
        let controller = UIHostingController(rootView: AnyView(IOSTranslateTasks(props: props)))
        hostingController = controller
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene, let rootVC = windowScene.windows.first?.rootViewController {
            rootVC.addChild(controller); rootVC.view.addSubview(controller.view)
            controller.view.frame = CGRect(x: 0, y: 0, width: 1, height: 1); controller.view.isHidden = true; controller.didMove(toParent: rootVC)
        }
    }

    @MainActor private func presentTranslationSheet(_ props: SheetProps) {
        let controller = UIHostingController(rootView: AnyView(IOSTranslateSheet(props: props)))
        hostingController = controller
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene, let rootVC = windowScene.windows.first?.rootViewController {
            rootVC.addChild(controller); rootVC.view.addSubview(controller.view)
            controller.view.frame = CGRect(x: 0, y: 0, width: 1, height: 1); controller.view.isHidden = true; controller.didMove(toParent: rootVC)
        }
    }

    @MainActor private func dismissTranslationView() {
        if let controller = hostingController { controller.view.removeFromSuperview(); controller.removeFromParent(); hostingController = nil }
    }
}
