//  KeelTheme.swift
//  Keel — design tokens for SwiftUI.
//
//  Mirrors keel-theme.js 1:1. The web app reads these as CSS variables
//  (var(--bg), var(--pine), …); this file is the SwiftUI equivalent so a
//  port is a copy-paste of the same hex values. Keep the two in sync.

import SwiftUI

extension Color {
    init(hex: String) {
        let s = Scanner(string: hex.replacingOccurrences(of: "#", with: ""))
        var rgb: UInt64 = 0; s.scanHexInt64(&rgb)
        self.init(.sRGB,
                  red:   Double((rgb >> 16) & 0xFF) / 255,
                  green: Double((rgb >> 8)  & 0xFF) / 255,
                  blue:  Double(rgb & 0xFF) / 255,
                  opacity: 1)
    }
}

/// Semantic palette. Switch `mode` to flip the whole app, just like
/// `data-theme` on the web.
enum KeelMode { case light, dark }

struct Keel {
    var mode: KeelMode = .light

    // MARK: surfaces & text
    var bg:       Color { mode == .light ? Color(hex: "EBE6DA") : Color(hex: "141915") }
    var surface:  Color { mode == .light ? Color(hex: "FBFAF5") : Color(hex: "1E2620") }
    var surface2: Color { mode == .light ? Color(hex: "F2EEE2") : Color(hex: "27302A") }
    var ink:      Color { mode == .light ? Color(hex: "1A201C") : Color(hex: "ECE7DA") }
    var muted:    Color { mode == .light ? Color(hex: "6B726B") : Color(hex: "8C948B") }

    // MARK: brand accents (same roles as the web tokens)
    var pine:  Color { mode == .light ? Color(hex: "1F4D3A") : Color(hex: "5AA77F") } // primary
    var clay:  Color { mode == .light ? Color(hex: "C16A3B") : Color(hex: "D98A57") } // attention
    var gold:  Color { mode == .light ? Color(hex: "A6822F") : Color(hex: "CBA94E") } // goals
    var mint:  Color { mode == .light ? Color(hex: "2FA374") : Color(hex: "4FBE92") } // positive
    var zakat: Color { mode == .light ? Color(hex: "2E6E6B") : Color(hex: "56A8A2") } // zakat set-aside

    var onPine: Color { mode == .light ? Color(hex: "F4F1E6") : Color(hex: "0E1611") }
    var heroBg: Color { mode == .light ? pine               : Color(hex: "213A2D") }

    // MARK: type & shape
    static let displayFont = "Fraunces"
    static let uiFont      = "Hanken Grotesk"
    static let cardRadius: CGFloat = 22
    static let pad:        CGFloat = 18
}

// Usage:  @State private var theme = Keel(mode: .light)
//         Text("$3,800").font(.custom(Keel.displayFont, size: 56)).foregroundColor(theme.heroBg)
