import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "광고성 정보 수신 동의",
  description: "LOGOS.ai 전자적 전송매체를 통한 광고성 정보 수신 동의",
};

export default function MarketingConsentPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
      <h1 className="text-2xl font-bold mb-8 text-center">
        전자적 전송매체를 통한 광고성 정보 수신 동의
      </h1>

      <section className="space-y-6 text-sm leading-relaxed">
        <p>
          스터풀(이하 &quot;회사&quot;)은 「정보통신망 이용촉진 및 정보보호 등에
          관한 법률」 제50조에 의거하여, 이용자의 사전 수신 동의를 받고 광고성
          정보를 전송하고자 합니다.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                  항목
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                  내용
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-medium whitespace-nowrap">
                  전송 매체
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  이메일, 앱 푸시 알림, 문자메시지(SMS/MMS), 카카오톡 등
                  메신저
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-medium whitespace-nowrap">
                  전송 내용
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  신규 기능 출시 안내, 이벤트·프로모션 정보, 할인 혜택 및 쿠폰,
                  서비스 활용 팁, 파트너 제휴 혜택
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-medium whitespace-nowrap">
                  전송 빈도
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  월 최대 4회 (수시 이벤트 시 추가 발송될 수 있음)
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-medium whitespace-nowrap">
                  수신 거부 방법
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  이메일 내 &quot;수신 거부&quot; 링크 클릭, 서비스 내 알림 설정
                  변경, 고객센터 연락 (055-389-6223, support@logos.builders)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="font-semibold">안내 사항</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              위 동의는 선택 사항이며, 동의하지 않으셔도 LOGOS.ai 서비스 이용에
              제한이 없습니다.
            </li>
            <li>
              동의 후에도 언제든지 수신을 거부할 수 있으며, 수신 거부 시
              광고성 정보 발송이 즉시 중단됩니다.
            </li>
            <li>
              야간(오후 9시~오전 8시)에는 별도의 수신 동의 없이 광고성 정보를
              전송하지 않습니다.
            </li>
            <li>
              광고성 정보에는 전송자의 명칭, 연락처 및 수신 거부 방법이
              명시됩니다.
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
          <p className="font-semibold">관련 법령</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>
              정보통신망 이용촉진 및 정보보호 등에 관한 법률 제50조 (영리목적의
              광고성 정보 전송 제한)
            </li>
            <li>
              정보통신망 이용촉진 및 정보보호 등에 관한 법률 제50조의8
              (이용자의 연락처 수집 금지 등)
            </li>
          </ul>
        </div>

        <div className="border-t pt-6 mt-8 text-xs text-gray-500 space-y-1">
          <p>
            <strong>전송자 정보</strong>
          </p>
          <p>상호: 스터풀 (대표: 조현웅)</p>
          <p>사업자등록번호: 508-14-52353</p>
          <p>
            소재지: 경상남도 양산시 동면 금오16길 122, 513동 2202호
          </p>
          <p>연락처: 055-389-6223</p>
          <p>이메일: support@logos.builders</p>
          <p className="mt-2">시행일: 2024년 1월 18일</p>
        </div>
      </section>
    </main>
  );
}
