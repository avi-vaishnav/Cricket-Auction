package com.avproauction.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.avproauction.data.models.Auction
import com.avproauction.ui.AuctionViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuctionsListScreen(
    onNavigateToConduct: (String) -> Unit,
    onLogout: () -> Unit,
    viewModel: AuctionViewModel = viewModel()
) {
    val auctions by viewModel.auctions.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadAuctions()
    }

    var showCreateDialog by remember { mutableStateOf(false) }
    var newAuctionName by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Auctions", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { viewModel.loadAuctions() }) {
                        Icon(Icons.Default.Refresh, "Refresh")
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, "Logout", tint = MaterialTheme.colorScheme.error)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, "Create Auction")
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (isLoading && auctions.isEmpty()) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else if (error != null && auctions.isEmpty()) {
                Column(modifier = Modifier.align(Alignment.Center), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(error!!, color = MaterialTheme.colorScheme.error)
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { viewModel.loadAuctions() }) { Text("Retry") }
                }
            } else if (auctions.isEmpty()) {
                Text("No auctions found.", modifier = Modifier.align(Alignment.Center), color = Color.Gray)
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(auctions) { auction ->
                        AuctionCard(auction = auction, onClick = { onNavigateToConduct(auction.id) })
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = { Text("Create New Auction") },
            text = {
                OutlinedTextField(
                    value = newAuctionName,
                    onValueChange = { newAuctionName = it },
                    label = { Text("Auction Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newAuctionName.isNotBlank()) {
                            viewModel.createAuction(newAuctionName) {
                                showCreateDialog = false
                                newAuctionName = ""
                            }
                        }
                    },
                    enabled = !isLoading && newAuctionName.isNotBlank()
                ) {
                    if (isLoading) CircularProgressIndicator(size = 18.dp, color = Color.White)
                    else Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun AuctionCard(auction: Auction, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), justifyContent = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(auction.name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                
                val statusColor = when (auction.status) {
                    "LIVE" -> MaterialTheme.colorScheme.secondary
                    "COMPLETED" -> Color.Gray
                    else -> Color(0xFFF59E0B) // Amber
                }
                
                Box(modifier = Modifier.background(statusColor.copy(alpha = 0.2f), RoundedCornerShape(4.dp)).padding(horizontal = 8.dp, vertical = 4.dp)) {
                    Text(auction.status, color = statusColor, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            Text("Code: ${auction.code}", color = Color.Gray, fontSize = 14.sp)
            
            Spacer(modifier = Modifier.height(16.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column(modifier = Modifier.background(Color.White.copy(0.05f), RoundedCornerShape(8.dp)).padding(12.dp).weight(1f)) {
                    Text("TEAMS", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                    Text("${auction._count?.teams ?: 0}", fontSize = 18.sp, color = Color.White, fontWeight = FontWeight.Black)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.background(Color.White.copy(0.05f), RoundedCornerShape(8.dp)).padding(12.dp).weight(1f)) {
                    Text("PLAYERS", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                    Text("${auction._count?.players ?: 0}", fontSize = 18.sp, color = Color.White, fontWeight = FontWeight.Black)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onClick,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha=0.2f), contentColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Conduct Auction", fontWeight = FontWeight.Bold)
            }
        }
    }
}
