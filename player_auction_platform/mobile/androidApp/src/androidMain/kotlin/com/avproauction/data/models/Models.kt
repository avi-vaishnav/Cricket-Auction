package com.avproauction.data.models

data class Player(
    val id: String = "",
    val name: String = "",
    val number: Int? = null,
    val photoUrl: String? = null,
    val category: String? = null,
    val age: Int? = null,
    val basePrice: Double = 0.0,
    val soldPrice: Double? = null,
    val status: String = "PENDING",
    val teamId: String? = null,
    val auctionId: String = ""
)

data class Team(
    val id: String = "",
    val name: String = "",
    val logoUrl: String? = null,
    val budgetTotal: Double = 0.0,
    val budgetSpent: Double = 0.0,
    val maxBid: Double? = null,
    val auctionId: String = "",
    val players: List<Player>? = null
)

data class Bid(
    val id: String = "",
    val amount: Double = 0.0,
    val playerId: String = "",
    val teamId: String = "",
    val auctionId: String = "",
    val timestamp: String = "",
    val team: Team? = null
)

data class Auction(
    val id: String = "",
    val name: String = "",
    val code: String = "",
    val status: String = "UPCOMING",
    val teams: List<Team>? = null,
    val players: List<Player>? = null,
    val _count: AuctionCount? = null
)

data class AuctionCount(
    val teams: Int = 0,
    val players: Int = 0
)

data class AuctionFullState(
    val auctionId: String = "",
    val auctionName: String = "",
    val auctionCode: String = "",
    val currentPlayer: Player? = null,
    val currentBid: Double = 0.0,
    val leadingTeam: Team? = null,
    val currentRound: Int = 1,
    val auctionStatus: String = "IDLE",
    val teams: List<Team> = emptyList(),
    val players: List<Player> = emptyList(),
    val bidHistory: List<Bid> = emptyList()
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val phone: String,
    val category: String,
    val photoUrl: String?
)

data class LoginResponse(
    val access_token: String,
    val user: UserInfo
)

data class UserInfo(
    val id: String,
    val email: String,
    val name: String,
    val role: String
)

data class SocketError(
    val code: String? = null,
    val message: String = ""
)
