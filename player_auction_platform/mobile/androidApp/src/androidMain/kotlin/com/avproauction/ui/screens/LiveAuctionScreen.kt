package com.avproauction.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.avproauction.data.models.AuctionFullState
import com.avproauction.data.models.Team
import com.avproauction.ui.AuctionViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LiveAuctionScreen(
    identifier: String,
    mode: String,
    onExit: () -> Unit,
    viewModel: AuctionViewModel = viewModel()
) {
    val state by viewModel.liveAuctionState.collectAsState(initial = AuctionFullState())
    val isConnected by viewModel.socketConnected.collectAsState()
    val error by viewModel.socketError.collectAsState(initial = null)
    val context = LocalContext.current

    LaunchedEffect(identifier) {
        viewModel.connectToAuction(identifier, mode)
    }

    LaunchedEffect(error) {
        error?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(if (mode == "auctioneer") "Conducting: ${state.auctionName}" else "Viewing: ${state.auctionCode}", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text("Round ${state.currentRound} • ${state.auctionStatus}", fontSize = 12.sp, color = Color.Gray)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = {
                        viewModel.disconnectAuction()
                        onExit()
                    }) {
                        Icon(Icons.Default.Close, "Exit")
                    }
                },
                actions = {
                    Icon(
                        if (isConnected) Icons.Default.Wifi else Icons.Default.WifiOff,
                        contentDescription = null,
                        tint = if (isConnected) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(end = 16.dp)
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            
            if (state.auctionStatus == "IDLE") {
                IdleState(viewModel, mode)
            } else if (state.auctionStatus == "COMPLETED") {
                CompletedState(viewModel, mode)
            } else if (state.auctionStatus == "BIDDING") {
                if (mode == "auctioneer") {
                    AuctioneerBiddingPanel(viewModel, state)
                } else {
                    ViewerBiddingPanel(state)
                }
            }
        }
    }
}

@Composable
fun IdleState(viewModel: AuctionViewModel, mode: String) {
    Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Icon(Icons.Default.Bolt, contentDescription = null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text(if (mode == "auctioneer") "Ready to Begin" else "Waiting for Auctioneer", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(modifier = Modifier.height(32.dp))
        
        if (mode == "auctioneer") {
            Button(
                onClick = { viewModel.emitStartAuction() },
                modifier = Modifier.height(56.dp).width(200.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("Start Auction", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun CompletedState(viewModel: AuctionViewModel, mode: String) {
    Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Icon(Icons.Default.EmojiEvents, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text("Auction Complete", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        
        if (mode == "auctioneer") {
            Spacer(modifier = Modifier.height(32.dp))
            Button(
                onClick = { viewModel.emitUndoAction() },
                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Undo, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Undo Last Action")
            }
        }
    }
}

@Composable
fun ViewerBiddingPanel(state: AuctionFullState) {
    val player = state.currentPlayer ?: return
    
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // Player Card
        Card(modifier = Modifier.fillMaxWidth().weight(1f), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface), shape = RoundedCornerShape(24.dp)) {
            Column(modifier = Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Text(player.name.uppercase(), fontSize = 32.sp, fontWeight = FontWeight.Black, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Badge(containerColor = MaterialTheme.colorScheme.primary) { Text(player.category ?: "GENERAL", modifier = Modifier.padding(4.dp)) }
                    player.number?.let { Badge(containerColor = Color.Gray) { Text("#$it", modifier = Modifier.padding(4.dp)) } }
                }
                
                Spacer(modifier = Modifier.height(48.dp))
                Text("CURRENT BID", fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                Text("₹${state.currentBid.toInt()}", fontSize = 48.sp, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.secondary)
                
                state.leadingTeam?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.EmojiEvents, null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(it.name, color = MaterialTheme.colorScheme.secondary, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun AuctioneerBiddingPanel(viewModel: AuctionViewModel, state: AuctionFullState) {
    var selectedTeamId by remember { mutableStateOf<String?>(null) }
    val player = state.currentPlayer ?: return
    
    val canSkip = state.currentRound >= 3 && state.bidHistory.isEmpty()
    val canSell = state.leadingTeam != null
    
    val selectedTeam = state.teams.find { it.id == selectedTeamId }
    val remainingBudget = selectedTeam?.let { it.budgetTotal - it.budgetSpent } ?: 0.0

    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        
        // --- 1. Player Info ---
        item {
            Card(modifier = Modifier.fillMaxWidth().padding(top=8.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(player.name.uppercase(), fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color.White)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Base: ₹${player.basePrice.toInt()}", color = Color.Gray, fontSize = 12.sp)
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("CURRENT BID", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                    Text("₹${state.currentBid.toInt()}", fontSize = 40.sp, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.secondary)
                    
                    state.leadingTeam?.let {
                        Text(it.name, color = MaterialTheme.colorScheme.secondary, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // --- 2. Action Buttons ---
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { viewModel.emitSellPlayer() },
                    enabled = canSell,
                    modifier = Modifier.weight(1f).height(64.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(Icons.Default.Gavel, null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("SELL", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                }
                
                Button(
                    onClick = { viewModel.emitUnsoldPlayer() },
                    modifier = Modifier.weight(1f).height(64.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(Icons.Default.Cancel, null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("UNSOLD", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                }
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { viewModel.emitUndoAction() },
                    modifier = Modifier.weight(1f).height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B).copy(alpha = 0.2f), contentColor = Color(0xFFF59E0B)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Undo, null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("UNDO", fontWeight = FontWeight.Bold)
                }
                
                Button(
                    onClick = { viewModel.emitSkipPlayer() },
                    enabled = canSkip,
                    modifier = Modifier.weight(1f).height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFA855F7).copy(alpha = 0.2f), contentColor = Color(0xFFA855F7)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.SkipNext, null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (state.currentRound < 3) "SKIP (R3+)" else "SKIP", fontWeight = FontWeight.Bold)
                }
            }
        }

        // --- 3. Team Selector ---
        item {
            Text("SELECT TEAM", fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp, bottom = 8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                state.teams.take(2).forEach { team -> TeamButton(team, selectedTeamId, state.currentBid) { selectedTeamId = it } }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                state.teams.drop(2).take(2).forEach { team -> TeamButton(team, selectedTeamId, state.currentBid) { selectedTeamId = it } }
            }
            // Real app would use a LazyVerticalGrid, using Rows for simplicity in full snippet
        }

        // --- 4. Bid Increments ---
        item {
            Text("PLACE BID", fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp, bottom = 8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(5000.0, 10000.0, 25000.0).forEach { inc ->
                    BidButton(inc, state.currentBid, selectedTeamId, remainingBudget, viewModel)
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(50000.0, 100000.0).forEach { inc ->
                    BidButton(inc, state.currentBid, selectedTeamId, remainingBudget, viewModel)
                }
            }
        }

        // --- 5. Bid History ---
        item {
            Text("BID HISTORY", fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 16.dp, bottom = 8.dp))
        }
        
        itemsIndexed(state.bidHistory) { index, bid ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(if (index == 0) MaterialTheme.colorScheme.secondary.copy(alpha = 0.1f) else Color.White.copy(0.05f), RoundedCornerShape(8.dp))
                    .border(1.dp, if (index == 0) MaterialTheme.colorScheme.secondary.copy(alpha=0.3f) else Color.Transparent, RoundedCornerShape(8.dp))
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(bid.team?.name ?: "Unknown", fontWeight = FontWeight.Bold, color = if(index==0) MaterialTheme.colorScheme.secondary else Color.LightGray)
                Text("₹${bid.amount.toInt()}", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
        
        item { Spacer(modifier = Modifier.height(32.dp)) }
    }
}

@Composable
fun RowScope.TeamButton(team: Team, selectedId: String?, currentBid: Double, onSelect: (String) -> Unit) {
    val remaining = team.budgetTotal - team.budgetSpent
    val isLow = remaining < currentBid
    val isSelected = selectedId == team.id

    Column(
        modifier = Modifier
            .weight(1f)
            .height(60.dp)
            .background(
                color = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.2f) else if (isLow) Color.White.copy(alpha = 0.02f) else Color.White.copy(alpha = 0.05f),
                shape = RoundedCornerShape(12.dp)
            )
            .border(
                width = 1.dp,
                color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent,
                shape = RoundedCornerShape(12.dp)
            )
            .clickable(enabled = !isLow) { onSelect(team.id) }
            .padding(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(team.name, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (isLow) Color.DarkGray else Color.White, maxLines = 1)
        Text("₹${remaining.toInt()}", fontSize = 10.sp, color = if (isLow) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.secondary)
    }
}

@Composable
fun RowScope.BidButton(increment: Double, currentBid: Double, selectedTeamId: String?, remainingBudget: Double, viewModel: AuctionViewModel) {
    val nextBid = currentBid + increment
    val disabled = selectedTeamId == null || remainingBudget < nextBid
    
    val text = if (increment >= 100000) "+${increment.toInt()/100000}L" else "+${increment.toInt()/1000}K"

    Button(
        onClick = { viewModel.emitPlaceBid(selectedTeamId!!, nextBid) },
        enabled = !disabled,
        modifier = Modifier.weight(1f).height(48.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f), disabledContainerColor = Color.White.copy(alpha=0.02f))
    ) {
        Text(text, fontWeight = FontWeight.Bold)
    }
}
