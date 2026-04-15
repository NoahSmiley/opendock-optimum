import SwiftUI

enum Theme {
    static let bg = Color(red: 0.024, green: 0.024, blue: 0.024)
    static let elevated = Color(red: 0.039, green: 0.039, blue: 0.039)
    static let input = Color(red: 0.067, green: 0.067, blue: 0.067)
    static let text = Color(red: 0.784, green: 0.784, blue: 0.784)
    static let muted = Color(red: 0.510, green: 0.510, blue: 0.510)
    static let faint = Color(red: 0.333, green: 0.333, blue: 0.333)
    static let ghost = Color(red: 0.200, green: 0.200, blue: 0.200)
    static let active = Color.white
    static let border = Color(red: 0.102, green: 0.102, blue: 0.102)
    static let error = Color(red: 0.8, green: 0.267, blue: 0.267)

    static let fontName = "OpenAISans-Regular"
    static let fontMedium = "OpenAISans-Medium"
    static let fontSemibold = "OpenAISans-Semibold"

    static func setupGlobal() {
        let tab = UITabBarAppearance()
        tab.configureWithOpaqueBackground()
        tab.backgroundColor = UIColor(bg)
        tab.stackedLayoutAppearance.normal.iconColor = UIColor(ghost)
        tab.stackedLayoutAppearance.normal.titleTextAttributes = [.foregroundColor: UIColor(ghost)]
        tab.stackedLayoutAppearance.selected.iconColor = UIColor(active)
        tab.stackedLayoutAppearance.selected.titleTextAttributes = [.foregroundColor: UIColor(active)]
        UITabBar.appearance().standardAppearance = tab
        UITabBar.appearance().scrollEdgeAppearance = tab

        let nav = UINavigationBarAppearance()
        nav.configureWithOpaqueBackground()
        nav.backgroundColor = UIColor(bg)
        nav.shadowColor = .clear
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
        UINavigationBar.appearance().tintColor = UIColor(muted)
        UITextView.appearance().tintColor = UIColor(text)
    }
}
