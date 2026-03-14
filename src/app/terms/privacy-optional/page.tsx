import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 선택적 수집·이용 동의",
  description: "LOGOS.ai 개인정보 선택적 수집·이용 동의",
};

export default function PrivacyOptionalPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
      <h1 className="text-2xl font-bold mb-8 text-center">
        개인정보 선택적 수집·이용 동의
      </h1>

      <section className="space-y-6 text-sm leading-relaxed">
        <p>
          스터풀(이하 &quot;회사&quot;)은 마케팅 및 서비스 개선을 위해 아래와
          같이 개인정보를 선택적으로 수집·이용하고자 합니다. 내용을 확인하신 후
          동의 여부를 결정해 주세요.
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
                  수집 항목
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  이메일 주소, 이름(닉네임), 서비스 이용 기록, 관심 분야
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-medium whitespace-nowrap">
                  수집 목적
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  신규 기능 안내, 이벤트·프로모션 정보 제공, 할인 쿠폰 발송,
                  맞춤형 서비스 추천, 서비스 개선을 위한 통계 분석
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-medium whitespace-nowrap">
                  보유 기간
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  동의 철회 시 또는 회원 탈퇴 시까지 (최대 1년간 미이용 시 파기)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="font-semibold">안내 사항</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              위 동의는 선택 사항이며, 동의하지 않으셔도 서비스 이용에 제한이
              없습니다.
            </li>
            <li>
              동의 후에도 언제든지 서비스 내 설정 또는 고객센터를 통해 동의를
              철회할 수 있습니다.
            </li>
            <li>
              동의를 철회하면 마케팅 목적의 개인정보 이용이 즉시 중단되며,
              해당 정보는 지체 없이 파기됩니다.
            </li>
          </ul>
        </div>

        <div className="border-t pt-6 mt-8 text-xs text-gray-500 space-y-1">
          <p>
            <strong>개인정보처리자</strong>: 스터풀 (대표: 조현웅)
          </p>
          <p>문의: support@logos.builders | 055-389-6223</p>
          <p>시행일: 2024년 1월 18일</p>
        </div>
      </section>
    </main>
  );
}
