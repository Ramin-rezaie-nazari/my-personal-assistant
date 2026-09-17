import SwiftUI

public class Props: ObservableObject {
  @Published var texts: [String] = []
  @Published var onSuccess: ((_ translatedTexts: [String], _ detectedSourceLanguage: String?) -> Void)?
  @Published var onError: ((String) -> Void)?
  @Published var shouldTranslate: Bool = false
  @Published var sourceLanguage: String?
  @Published var targetLanguage: String?
}

public class SheetProps: ObservableObject {
  @Published var text: String = ""
  @Published var isPresented: Bool = false
  @Published var onHide: () -> Void = {}
  @Published var opacity: Double = 0.0
}
