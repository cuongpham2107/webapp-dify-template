# Debug Token Tracking

## Các bước để test và debug:

### 1. ✅ Kiểm tra Database Schema
```bash
npx prisma db push
npx prisma generate
```
- Database đã sync ✅
- Prisma Client đã generate ✅

### 2. 🔄 Restart Dev Server
**QUAN TRỌNG**: Bạn cần restart Next.js dev server để nó load Prisma Client mới!

Trong terminal đang chạy dev server:
1. Nhấn `Ctrl + C` để stop server
2. Chạy lại: `npm run dev` hoặc `bun dev`

### 3. 🧪 Test Flow

Sau khi restart server, thử chat và xem console logs:

#### Frontend Console (Browser DevTools):
- `onMessageEnd messageEnd:` - Xem toàn bộ messageEnd object
- `onMessageEnd metadata:` - Xem metadata có gì
- `onMessageEnd usage:` - Xem có trường usage không
- `🔥 Updating tokens:` - Số tokens sẽ được update
- `✅ Token update response:` - Response từ API
- `⚠️ No usage data found` - Nếu không có usage data

#### Backend Console (Terminal):
- `📥 API /api/user/update-tokens called` - API được gọi
- `👤 Session:` - Email của user
- `🎯 Total tokens to add:` - Số tokens sẽ add
- `💾 Updating user tokens in database...` - Đang update DB
- `✅ Tokens updated successfully. New total:` - Tổng tokens mới

### 4. 🔍 Kiểm tra kết quả

#### Trong Admin UI:
1. Truy cập: http://localhost:3000/admin/users
2. Xem cột "Token đã sử dụng"
3. Refresh trang sau khi chat để xem số token có tăng không

#### Query trực tiếp Database (nếu cần):
```sql
SELECT id, email, tokensUsed FROM User WHERE email = 'superadmin@asgl.net.vn';
```

### 5. ❓ Troubleshooting

#### Nếu không thấy log "🔥 Updating tokens":
- `messageEnd.metadata.usage` có thể null/undefined
- Kiểm tra log `onMessageEnd metadata:` để xem structure
- Có thể Dify API không trả về usage data

#### Nếu không thấy log "📥 API /api/user/update-tokens called":
- API không được gọi
- Kiểm tra network tab trong browser DevTools
- Có thể có lỗi CORS hoặc network

#### Nếu thấy error "Unknown argument tokensUsed":
- Prisma Client chưa reload
- Cần restart dev server!

#### Nếu API trả về 401 Unauthorized:
- Session không tồn tại
- User chưa đăng nhập
- Kiểm tra NextAuth config

### 6. 📊 Expected Flow

```
1. User sends message
   ↓
2. Dify processes and responds
   ↓
3. onMessageEnd triggered with usage data
   ↓
4. Frontend logs: "🔥 Updating tokens: 1916"
   ↓
5. Frontend calls POST /api/user/update-tokens
   ↓
6. Backend logs: "📥 API /api/user/update-tokens called"
   ↓
7. Backend logs: "👤 Session: superadmin@asgl.net.vn"
   ↓
8. Backend logs: "🎯 Total tokens to add: 1916"
   ↓
9. Prisma updates database
   ↓
10. Backend logs: "✅ Tokens updated successfully. New total: 1916"
   ↓
11. Frontend logs: "✅ Token update response: {success: true, tokensUsed: 1916}"
   ↓
12. Check admin page to see updated value
```

## 🚨 QUAN TRỌNG

**Bước quan trọng nhất**: RESTART DEV SERVER sau khi chạy `prisma generate`!

Next.js cache Prisma Client, nếu không restart thì sẽ vẫn dùng client cũ không có trường `tokensUsed`.
