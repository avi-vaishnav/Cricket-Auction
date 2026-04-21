package com.avproauction

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.avproauction.ui.screens.AuctionsListScreen
import com.avproauction.ui.screens.LiveAuctionScreen
import com.avproauction.ui.screens.LoginScreen
import com.avproauction.ui.screens.SignupScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            val darkColors = darkColorScheme(
                primary = Color(0xFF3B82F6), // Blue 500
                secondary = Color(0xFF10B981), // Emerald 500
                background = Color(0xFF030712), // Very dark slate
                surface = Color(0xFF1E293B)  // Slate 800
            )

            MaterialTheme(colorScheme = darkColors) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()

                    NavHost(navController = navController, startDestination = "login") {
                        composable("login") {
                            LoginScreen(
                                onNavigateToDashboard = { navController.navigate("auctions") { popUpTo("login") { inclusive = true } } },
                                onNavigateToViewer = { code -> navController.navigate("live_viewer/$code") },
                                onNavigateToSignup = { navController.navigate("signup") }
                            )
                        }

                        composable("signup") {
                            SignupScreen(
                                onNavigateBack = { navController.popBackStack() },
                                onSuccess = { navController.navigate("auctions") { popUpTo("login") { inclusive = true } } }
                            )
                        }
                        
                        composable("auctions") {
                            AuctionsListScreen(
                                onNavigateToConduct = { id -> navController.navigate("live_auctioneer/$id") },
                                onLogout = { navController.navigate("login") { popUpTo("auctions") { inclusive = true } } }
                            )
                        }

                        composable(
                            "live_auctioneer/{id}",
                            arguments = listOf(navArgument("id") { type = NavType.StringType })
                        ) { backStackEntry ->
                            val id = backStackEntry.arguments?.getString("id") ?: ""
                            LiveAuctionScreen(
                                identifier = id,
                                mode = "auctioneer",
                                onExit = { navController.popBackStack() }
                            )
                        }

                        composable(
                            "live_viewer/{code}",
                            arguments = listOf(navArgument("code") { type = NavType.StringType })
                        ) { backStackEntry ->
                            val code = backStackEntry.arguments?.getString("code") ?: ""
                            LiveAuctionScreen(
                                identifier = code,
                                mode = "viewer",
                                onExit = { navController.popBackStack() }
                            )
                        }
                    }
                }
            }
        }
    }
}
