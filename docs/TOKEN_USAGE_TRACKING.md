# Token Usage Tracking Feature

## Tổng quan
Đã thêm tính năng tracking tổng số token mà user đã sử dụng trong hệ thống.

## Thay đổi đã thực hiện

### 1. Database Schema (prisma/schema.prisma)
- ✅ Thêm trường `tokensUsed` vào model `User`
- ✅ Giá trị mặc định: `0` (đảm bảo dữ liệu cũ không bị ảnh hưởng)
- ✅ Kiểu dữ liệu: `Int`

```prisma
model User {
  ...
  tokensUsed  Int              @default(0)
  ...
}
```

### 2. Migration
- ✅ Tạo migration: `20250121000000_add_tokens_used_to_user`
- ✅ Migration SQL an toàn:
  ```sql
  ALTER TABLE `User` ADD COLUMN `tokensUsed` INTEGER NOT NULL DEFAULT 0;
  ```
- ✅ Migration đã được apply thành công
- ⚠️ **Lưu ý**: Tất cả user hiện tại sẽ có `tokensUsed = 0`

### 3. API Endpoint (/app/api/user/update-tokens/route.ts)
- ✅ Method: `POST`
- ✅ Authentication: Yêu cầu NextAuth session
- ✅ Body: `{ totalTokens: number }`
- ✅ Chức năng: Tăng token count của user hiện tại
- ✅ Response: `{ success: true, tokensUsed: number }`

### 4. Frontend Logic (app/components/index.tsx)
- ✅ Thêm logic trong `onMessageEnd` callback
- ✅ Tự động gọi API khi nhận được `messageEnd.metadata.usage.total_tokens`
- ✅ Error handling: Log lỗi nếu API call thất bại
- ✅ Không block UI nếu API call thất bại

### 5. Type Definitions (app/components/chat/type.ts)
- ✅ Cập nhật `MessageEnd` type để bao gồm trường `usage`
- ✅ Định nghĩa đầy đủ structure của `usage` object:
  - `completion_tokens`, `prompt_tokens`, `total_tokens`
  - `completion_price`, `prompt_price`, `total_price`
  - `latency`, `currency`

### 6. Admin UI (app/(app)/admin/users/page.tsx)
- ✅ Thêm cột "Token đã sử dụng" vào bảng users
- ✅ Hiển thị số token với format phù hợp (locale 'vi-VN')
- ✅ Sử dụng Badge component để highlight

## Cách hoạt động

1. **Khi user gửi message**:
   - System nhận response từ Dify API
   - Trong `onMessageEnd` event, nhận được object chứa `metadata.usage.total_tokens`

2. **Tự động cập nhật tokens**:
   - Frontend tự động gọi API `/api/user/update-tokens`
   - API tăng `tokensUsed` của user bằng cách sử dụng `increment`
   - Không cần lo lắng về race condition vì Prisma xử lý atomic increment

3. **Xem thống kê**:
   - Admin có thể xem tổng token đã sử dụng của mỗi user trong trang Admin Users
   - Số liệu được format đẹp với dấu phân cách hàng nghìn

## Bảo vệ dữ liệu cũ

✅ **Dữ liệu cũ được bảo toàn hoàn toàn**:
- Migration sử dụng `DEFAULT 0` nên tất cả user hiện có sẽ có giá trị 0
- Không có data loss
- Không có downtime
- Chỉ thêm cột mới, không modify/delete data cũ

## Testing

### Test API endpoint:
```bash
curl -X POST http://localhost:3000/api/user/update-tokens \
  -H "Content-Type: application/json" \
  -d '{"totalTokens": 1916}'
```

### Verify trong database:
```sql
SELECT id, email, tokensUsed FROM User;
```

## Lưu ý quan trọng

1. **Authentication**: API endpoint yêu cầu user đã đăng nhập
2. **Validation**: Chỉ chấp nhận số dương cho totalTokens
3. **Atomic Updates**: Sử dụng `increment` thay vì `set` để tránh race condition
4. **Error Handling**: Không throw error nếu token tracking thất bại (không ảnh hưởng UX)
5. **Performance**: API call không block UI, chạy async trong background

## Future Improvements

- [ ] Thêm token usage statistics/charts
- [ ] Set token limits per user
- [ ] Email notification khi đạt ngưỡng token
- [ ] Export token usage reports
- [ ] Token cost calculation
