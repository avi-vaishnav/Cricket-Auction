package com.avproauction.data.api

import com.avproauction.data.models.Auction
import com.avproauction.data.models.LoginRequest
import com.avproauction.data.models.LoginResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("auth/register")
    suspend fun register(@Body request: com.avproauction.data.models.RegisterRequest): LoginResponse

    @GET("auctions")
    suspend fun getAuctions(): List<Auction>

    @GET("auctions/{id}")
    suspend fun getAuctionById(@Path("id") id: String): Auction

    @POST("auctions")
    suspend fun createAuction(@Body request: Map<String, String>): Auction

    @GET("auctions/code/{code}")
    suspend fun getAuctionByCode(@Path("code") code: String): Auction
}
