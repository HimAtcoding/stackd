import Capacitor
import GoogleSignIn

// Native Google sign-in. It only returns Google's ID token; the web app hands that to Supabase's signInWithIdToken,
// which checks it. The nonce arrives already SHA-256 hashed, and Supabase gets the raw one.
@objc(GoogleSignInPlugin)
public class GoogleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GoogleSignInPlugin"
    public let jsName = "GoogleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise)
    ]

    private var signingIn = false

    @objc func authorize(_ call: CAPPluginCall) {
        guard let nonce = call.getString("nonce"), !nonce.isEmpty else {
            call.reject("A hashed nonce is required", "invalid_request")
            return
        }
        // Info.plist → GIDClientID, built from the GOOGLE_IOS_CLIENT_ID_PREFIX build setting. While that's empty the
        // ID starts with "." and the web app falls back to the in-app browser.
        guard let clientID = Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String,
              !clientID.isEmpty, !clientID.hasPrefix(".") else {
            call.reject("Google sign-in isn't set up in this build", "not_configured")
            return
        }
        DispatchQueue.main.async {
            guard !self.signingIn else {
                call.reject("A sign-in is already in progress", "in_progress")
                return
            }
            guard let presenter = self.bridge?.viewController else {
                call.reject("Nothing to show Google's sheet on", "failed")
                return
            }
            self.signingIn = true
            let google = GIDSignIn.sharedInstance
            google.configuration = GIDConfiguration(clientID: clientID)
            google.signIn(withPresenting: presenter, hint: nil, additionalScopes: nil, nonce: nonce) { result, error in
                self.signingIn = false
                // Stackd keeps only the ID token; Google's own session on the phone isn't needed after this
                defer { google.signOut() }
                if let error = error {
                    let cancelled = (error as? GIDSignInError)?.code == .canceled
                    call.reject(error.localizedDescription, cancelled ? "cancelled" : "failed", error)
                    return
                }
                guard let user = result?.user, let idToken = user.idToken?.tokenString else {
                    call.reject("Google returned no ID token", "failed")
                    return
                }
                var payload: [String: Any] = ["idToken": idToken]
                if let given = user.profile?.givenName { payload["givenName"] = given }
                call.resolve(payload)
            }
        }
    }
}
