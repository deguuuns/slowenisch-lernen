import { notFound } from 'next/navigation'
import ZeroScrollQaHarness from '@/components/ZeroScrollQaHarness'

export default function ZeroScrollQaPage(){
  if(process.env.NEXT_PUBLIC_ZERO_SCROLL_QA!=='1')notFound()
  return <ZeroScrollQaHarness/>
}
