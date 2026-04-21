package com.avproauction.data.socket

import com.avproauction.BuildConfig
import com.avproauction.data.models.AuctionFullState
import com.avproauction.data.models.SocketError
import com.google.gson.Gson
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject

class SocketManager {
    private var socket: Socket? = null
    private val gson = Gson()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected

    private val _auctionState = MutableSharedFlow<AuctionFullState>(replay = 1)
    val auctionState: SharedFlow<AuctionFullState> = _auctionState

    private val _error = MutableSharedFlow<String>(replay = 0, extraBufferCapacity = 1)
    val error: SharedFlow<String> = _error

    fun connect(identifier: String, mode: String) {
        if (socket != null) return

        try {
            val opts = IO.Options.builder()
                .setTransports(arrayOf("websocket"))
                .build()

            socket = IO.socket(BuildConfig.SOCKET_URL, opts)

            socket?.on(Socket.EVENT_CONNECT) {
                _isConnected.value = true

                val data = JSONObject()
                if (mode == "auctioneer") {
                    data.put("auctionId", identifier)
                } else {
                    data.put("auctionCode", identifier)
                }
                socket?.emit("joinRoom", data)
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                _isConnected.value = false
            }

            // Full state sync
            socket?.on("auctionState") { args ->
                if (args.isNotEmpty()) {
                    try {
                        val json = args[0].toString()
                        val state = gson.fromJson(json, AuctionFullState::class.java)
                        _auctionState.tryEmit(state)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }

            // Error events
            socket?.on("bidError") { args ->
                if (args.isNotEmpty()) {
                    try {
                        val json = args[0].toString()
                        val err = gson.fromJson(json, SocketError::class.java)
                        _error.tryEmit(err.message)
                    } catch (_: Exception) {}
                }
            }

            socket?.on("error") { args ->
                if (args.isNotEmpty()) {
                    try {
                        val json = args[0].toString()
                        val err = gson.fromJson(json, SocketError::class.java)
                        _error.tryEmit(err.message)
                    } catch (_: Exception) {}
                }
            }

            // Informational events (could trigger UI notifications)
            socket?.on("playerSold") { }
            socket?.on("playerUnsold") { }
            socket?.on("playerSkipped") { }
            socket?.on("actionUndone") { }
            socket?.on("viewerCount") { }

            socket?.connect()
        } catch (e: Exception) {
            e.printStackTrace()
            _error.tryEmit("Failed to connect: ${e.message}")
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        _isConnected.value = false
    }

    // ── Emitters ──────────────────────────────────────────────

    fun emitStartAuction(auctionId: String) {
        socket?.emit("startAuction", JSONObject().put("auctionId", auctionId))
    }

    fun emitPlaceBid(auctionId: String, teamId: String, amount: Double) {
        socket?.emit("placeBid", JSONObject().apply {
            put("auctionId", auctionId)
            put("teamId", teamId)
            put("amount", amount)
        })
    }

    fun emitSellPlayer(auctionId: String) {
        socket?.emit("sellPlayer", JSONObject().put("auctionId", auctionId))
    }

    fun emitUnsoldPlayer(auctionId: String) {
        socket?.emit("unsoldPlayer", JSONObject().put("auctionId", auctionId))
    }

    fun emitSkipPlayer(auctionId: String) {
        socket?.emit("skipPlayer", JSONObject().put("auctionId", auctionId))
    }

    fun emitNextPlayer(auctionId: String) {
        socket?.emit("nextPlayer", JSONObject().put("auctionId", auctionId))
    }

    fun emitUndoAction(auctionId: String) {
        socket?.emit("undoAction", JSONObject().put("auctionId", auctionId))
    }
}
