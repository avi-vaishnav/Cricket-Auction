package com.avproauction.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.avproauction.data.api.ApiClient
import com.avproauction.data.models.Auction
import com.avproauction.data.models.AuctionFullState
import com.avproauction.data.socket.SocketManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuctionViewModel : ViewModel() {
    private val socketManager = SocketManager()

    private val _auctions = MutableStateFlow<List<Auction>>(emptyList())
    val auctions: StateFlow<List<Auction>> = _auctions.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    val socketConnected = socketManager.isConnected
    val liveAuctionState = socketManager.auctionState
    val socketError = socketManager.error

    fun clearError() {
        _error.value = null
    }

    // ─── REST API Calls ──────────────────────────────────────────

    fun loadAuctions() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val list = ApiClient.api.getAuctions()
                _auctions.value = list
            } catch (e: Exception) {
                _error.value = "Failed to load auctions: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun createAuction(name: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                ApiClient.api.createAuction(mapOf("name" to name))
                loadAuctions()
                onSuccess()
            } catch (e: Exception) {
                _error.value = "Failed to create auction: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    // ─── Socket Operations ───────────────────────────────────────

    fun connectToAuction(identifier: String, mode: String) {
        socketManager.connect(identifier, mode)
    }

    fun disconnectAuction() {
        socketManager.disconnect()
    }

    fun emitStartAuction() {
        liveAuctionState.replayCache.firstOrNull()?.auctionId?.let {
            socketManager.emitStartAuction(it)
        }
    }

    fun emitPlaceBid(teamId: String, amount: Double) {
        liveAuctionState.replayCache.firstOrNull()?.auctionId?.let {
            socketManager.emitPlaceBid(it, teamId, amount)
        }
    }

    fun emitSellPlayer() {
        liveAuctionState.replayCache.firstOrNull()?.auctionId?.let {
            socketManager.emitSellPlayer(it)
        }
    }

    fun emitUnsoldPlayer() {
        liveAuctionState.replayCache.firstOrNull()?.auctionId?.let {
            socketManager.emitUnsoldPlayer(it)
        }
    }

    fun emitSkipPlayer() {
        liveAuctionState.replayCache.firstOrNull()?.auctionId?.let {
            socketManager.emitSkipPlayer(it)
        }
    }

    fun emitUndoAction() {
        liveAuctionState.replayCache.firstOrNull()?.auctionId?.let {
            socketManager.emitUndoAction(it)
        }
    }

    override fun onCleared() {
        super.onCleared()
        socketManager.disconnect()
    }
}
