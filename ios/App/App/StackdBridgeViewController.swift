import UIKit
import Capacitor

// The app's web view: Capacitor's, plus Stackd's own native plugin and a router for the static export.
class StackdBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleSignInPlugin())
    }

    override func router() -> Router {
        StaticExportRouter()
    }
}

// next build writes each page as <route>/index.html (trailingSlash). Capacitor's default router answers every path
// without a file extension with the root index.html, so a reload on /settings/ would draw Home's HTML there.
// This serves the page's own index.html when the export has one, and the root one otherwise.
struct StaticExportRouter: Router {
    var basePath: String = ""

    func route(for path: String) -> String {
        guard URL(fileURLWithPath: path).pathExtension.isEmpty else { return basePath + path }
        let root = basePath + "/index.html"
        if path.contains("..") { return root }
        let trimmed = path.hasSuffix("/") ? String(path.dropLast()) : path
        let page = basePath + trimmed + "/index.html"
        return FileManager.default.fileExists(atPath: page) ? page : root
    }
}
