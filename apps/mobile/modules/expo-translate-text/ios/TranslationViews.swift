import SwiftUI
#if canImport(Translation)
import Translation
#endif

struct IOSTranslateTasks: View {
  @ObservedObject var props: Props
  var body: some View {
    if #available(iOS 18.0, *) { IOSTranslateTasksAvailable(props: props) }
    else { IOSTranslateTasksUnavailable(props: props) }
  }
}

@available(iOS 18.0, *)
struct IOSTranslateTasksAvailable: View {
  @ObservedObject var props: Props
  @State private var configuration: TranslationSession.Configuration?

  var body: some View {
    Color.clear.frame(maxWidth: .infinity, maxHeight: .infinity)
      .translationTask(configuration) { session in await translateSequence(session) }
      .onAppear { configuration = makeConfiguration(from: props) }
  }

  private func translateSequence(_ session: TranslationSession) async {
    let requests = props.texts.enumerated().map { index, text in TranslationSession.Request(sourceText: text, clientIdentifier: "\(index)") }
    do {
      var translatedTexts = Array(repeating: "", count: props.texts.count)
      var detectedSourceLanguage: String?
      for try await response in session.translate(batch: requests) {
        if let index = Int(response.clientIdentifier ?? "") { translatedTexts[index] = response.targetText }
        if detectedSourceLanguage == nil { detectedSourceLanguage = response.sourceLanguage.minimalIdentifier }
      }
      DispatchQueue.main.async { props.onSuccess?(translatedTexts, detectedSourceLanguage) }
    } catch {
      DispatchQueue.main.async { props.onError?(friendlyErrorMessage(from: error)) }
    }
  }
}

struct IOSTranslateTasksUnavailable: View {
  @ObservedObject var props: Props
  var body: some View {
    Color.clear.onAppear { props.onError?("Translation is only supported on iOS 18.0 or newer") }
  }
}

struct IOSTranslateSheet: View {
  @ObservedObject var props: SheetProps
  var body: some View {
    if #available(iOS 17.4, *) {
      Color.clear.frame(maxWidth: .infinity, maxHeight: .infinity)
        .translationPresentation(isPresented: $props.isPresented, text: props.text)
        .onChange(of: props.isPresented) { oldValue, newValue in if oldValue && !newValue { props.onHide() } }
    } else { EmptyView() }
  }
}
