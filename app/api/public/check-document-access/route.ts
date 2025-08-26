

import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  //nhận 2 tham số là document_id và user_id 
  // kiểm tra trong bảng document_access xem quyền can_view có bằng true hay không 
  // trả về true hoặc false
}
