package com.avproauction.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.avproauction.data.api.ApiClient
import com.avproauction.data.models.LoginRequest
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onNavigateToDashboard: () -> Unit,
    onNavigateToViewer: (String) -> Unit,
    onNavigateToSignup: () -> Unit
) {
    var isAuctioneerMode by remember { mutableStateOf(true) }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {

            // Toggle Mode
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
                    .padding(4.dp)
            ) {
                Button(
                    onClick = { isAuctioneerMode = true },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isAuctioneerMode) MaterialTheme.colorScheme.primary else Color.Transparent,
                        contentColor = if (isAuctioneerMode) Color.White else Color.Gray
                    ),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Auctioneer Login")
                }
                Button(
                    onClick = { isAuctioneerMode = false },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (!isAuctioneerMode) MaterialTheme.colorScheme.primary else Color.Transparent,
                        contentColor = if (!isAuctioneerMode) Color.White else Color.Gray
                    ),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Join as Viewer")
                }
            }

            Spacer(modifier = Modifier.height(40.dp))

            if (isAuctioneerMode) {
                AuctioneerLoginForm(onNavigateToDashboard, onNavigateToSignup)
            } else {
                ViewerJoinForm(onNavigateToViewer)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuctioneerLoginForm(onSuccess: () -> Unit, onNavigateToSignup: () -> Unit) {
    val coroutineScope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Icon(Icons.Default.Lock, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(48.dp))
    Spacer(modifier = Modifier.height(16.dp))
    Text("Welcome Back", fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color.White)
    Text("Sign in to your command center", color = Color.Gray)
    
    Spacer(modifier = Modifier.height(32.dp))

    if (error != null) {
        Text(error!!, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(bottom = 16.dp))
    }

    OutlinedTextField(
        value = email,
        onValueChange = { email = it },
        label = { Text("Email Address") },
        leadingIcon = { Icon(Icons.Default.Mail, null) },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        singleLine = true,
        colors = TextFieldDefaults.outlinedTextFieldColors(focusedBorderColor = MaterialTheme.colorScheme.primary)
    )

    Spacer(modifier = Modifier.height(16.dp))

    OutlinedTextField(
        value = password,
        onValueChange = { password = it },
        label = { Text("Password") },
        leadingIcon = { Icon(Icons.Default.Lock, null) },
        visualTransformation = PasswordVisualTransformation(),
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        singleLine = true,
        colors = TextFieldDefaults.outlinedTextFieldColors(focusedBorderColor = MaterialTheme.colorScheme.primary)
    )

    Spacer(modifier = Modifier.height(32.dp))

    Button(
        onClick = {
            if (email.isBlank() || password.isBlank()) return@Button
            isLoading = true
            error = null
            coroutineScope.launch {
                try {
                    val response = ApiClient.api.login(LoginRequest(email, password))
                    // Simple in-memory token handling for mobile prototype
                    onSuccess()
                } catch (e: Exception) {
                    error = "Invalid email or password"
                } finally {
                    isLoading = false
                }
            }
        },
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(16.dp),
        enabled = !isLoading
    ) {
        if (isLoading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
        else Text("Sign In", fontSize = 16.sp, fontWeight = FontWeight.Bold)
    }
    
    Spacer(modifier = Modifier.height(8.dp))
    TextButton(onClick = onNavigateToSignup, modifier = Modifier.fillMaxWidth()) {
        Text("Don't have an account? Sign Up", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ViewerJoinForm(onJoin: (String) -> Unit) {
    val coroutineScope = rememberCoroutineScope()
    var code by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    Icon(Icons.Default.QrCodeScanner, contentDescription = null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(48.dp))
    Spacer(modifier = Modifier.height(16.dp))
    Text("Watch Live", fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color.White)
    Text("Enter an auction code to join", color = Color.Gray)
    
    Spacer(modifier = Modifier.height(32.dp))

    if (error != null) {
        Text(error!!, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(bottom = 16.dp))
    }

    OutlinedTextField(
        value = code,
        onValueChange = { code = it.uppercase() },
        label = { Text("Auction Code (e.g. IPL2026)") },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        singleLine = true,
        colors = TextFieldDefaults.outlinedTextFieldColors(focusedBorderColor = MaterialTheme.colorScheme.secondary)
    )

    Spacer(modifier = Modifier.height(32.dp))

    Button(
        onClick = { 
            if (code.isBlank()) {
                error = "Please enter an auction code"
                return@Button
            }
            isLoading = true
            error = null
            coroutineScope.launch {
                try {
                    val auction = ApiClient.api.getAuctionByCode(code.uppercase())
                    if (auction.status == "UPCOMING") {
                        error = "This auction hasn't started yet."
                    } else {
                        onJoin(code.uppercase())
                    }
                } catch (e: Exception) {
                    error = if (e.message?.contains("404") == true || e.message?.contains("Not Found") == true) {
                        "Invalid auction code. No auction found."
                    } else {
                        "Failed to verify code. Try again."
                    }
                } finally {
                    isLoading = false
                }
            }
        },
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(16.dp),
        enabled = !isLoading,
        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
    ) {
        if (isLoading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
        else Text("Join Auction", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
    }
}
