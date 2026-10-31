| Recurso | Endpoint | Corpo / resposta |
| --- | --- | --- |
| Sessão | POST /auth/signup | SignupInput → AuthResponse (409 CONFLICT) |
| | POST /auth/login | LoginInput → AuthResponse |
| | GET /auth/session | → Session (401 se expirada) |
| | POST /auth/logout | → 204 |
| NFTs | GET /nfts | NftListParams → NftListResponse |
| | GET /nfts/featured | → FeaturedResponse |
| | GET /nfts/:id | → Nft (404) |
| Favoritos | GET /favorites | → NftSummary[] |
| | PUT /favorites/:nftId | → 204 |
| | DELETE /favorites/:nftId | → 204 |
| Carrinho | GET /cart | → Cart |
| | POST /cart/items | AddCartItemInput → Cart (409 OUT_OF_STOCK) |
| | PATCH /cart/items/:itemId | UpdateCartItemInput → Cart |
| | DELETE /cart/items/:itemId | → Cart |
| | PUT /cart/coupon | ApplyCouponInput → Cart (422 COUPON_*) |
| | DELETE /cart/coupon | → Cart |
| | POST /cart/merge | { guestCartId } → Cart |
| Cotação | POST /quote | → Quote (do carrinho atual) |
| Pedidos | POST /orders | CreateOrderInput + header Idempotency-Key → Order (409 QUOTE_STALE / IDEMPOTENCY_CONFLICT) |
| | GET /orders/:id | → Order |
| Perfil | GET /profile | → User |
| | PATCH /profile | UpdateProfileInput → User |
| | POST /profile/avatar | multipart → User |
| | DELETE /profile/avatar | → User |
| | POST /profile/password | ChangePasswordInput → 204 |
| Carteiras | GET /wallets | → Wallet[] |
| | PUT /wallets/:slot | UpsertWalletInput → Wallet |
| | POST /wallets/:slot/connect | → 204 (422 WALLET_REJECTED) |