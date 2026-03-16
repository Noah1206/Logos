import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 이용약관",
  description: "LOGOS.ai 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
      <h1 className="text-2xl font-bold mb-8 text-center">서비스 이용약관</h1>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold mb-2">제1조 (목적)</h2>
          <p>
            이 약관은 스터풀(이하 &quot;회사&quot;)이 운영하는 LOGOS.ai
            서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의
            권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">제2조 (정의)</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              &quot;서비스&quot;란 회사가 제공하는 AI 기반 영상-블로그 변환
              서비스 및 부가 기능 일체를 말합니다.
            </li>
            <li>
              &quot;이용자&quot;란 본 약관에 동의하고 서비스를 이용하는 자를
              말합니다.
            </li>
            <li>
              &quot;크레딧&quot;이란 서비스 내에서 변환 기능을 이용하기 위해
              필요한 전자적 이용권을 말합니다.
            </li>
            <li>
              &quot;콘텐츠&quot;란 서비스를 통해 생성된 블로그 글, 텍스트 등
              결과물을 말합니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제3조 (약관의 효력 및 변경)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게
              공지함으로써 효력이 발생합니다.
            </li>
            <li>
              회사는 관련 법령에 위배되지 않는 범위에서 약관을 개정할 수 있으며,
              개정 시 적용일자 및 개정사유를 명시하여 현행 약관과 함께 서비스
              내에 7일 전부터 공지합니다.
            </li>
            <li>
              이용자가 개정약관의 적용에 동의하지 않는 경우, 서비스 이용을
              중단하고 탈퇴할 수 있습니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제4조 (서비스의 내용)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              유튜브 쇼츠, 인스타그램 릴스 등 영상 콘텐츠를 블로그 글로 자동
              변환하는 AI 기반 서비스
            </li>
            <li>블로그 글을 숏폼 영상 대본으로 변환하는 서비스</li>
            <li>블로그 SEO 점수 분석 도구</li>
            <li>기타 회사가 추가 개발하여 제공하는 부가 서비스</li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제5조 (이용계약의 체결)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              이용계약은 이용자가 본 약관에 동의하고 회원가입을 완료한 시점에
              체결됩니다.
            </li>
            <li>
              이용자는 가입 시 정확한 정보를 제공해야 하며, 허위 정보 제공 시
              서비스 이용이 제한될 수 있습니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제6조 (서비스 이용)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              현재 서비스는 로그인한 회원에게 모든 기능을 무제한 무료로 제공합니다.
            </li>
            <li>
              회사는 향후 서비스 정책 변경에 따라 유료 요금제를 도입할 수 있으며,
              이 경우 사전에 공지합니다.
            </li>
            <li>
              유료 전환 시 기존 무료 이용 내역은 보존되며, 추가 비용이 발생하지
              않습니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제7조 (서비스 제공기간)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              서비스는 이용자의 요청 즉시 AI가 자동으로 처리하며, 영상·PDF
              변환의 경우 통상 1~3분 이내에 결과가 제공됩니다.
            </li>
            <li>
              서버 상태, 콘텐츠 길이, 외부 API 응답 시간 등에 따라 처리 시간이
              달라질 수 있으며, 최대 10분 이내에 완료됩니다.
            </li>
            <li>
              월 구독 상품의 서비스 제공기간은 결제일로부터 1개월(30일)이며,
              자동 갱신됩니다.
            </li>
            <li>
              크레딧(이용권) 상품의 유효기간은 구매일로부터 1년입니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제8조 (청약철회 및 환불 정책)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              이용자는 구매일로부터 7일 이내에 청약철회를 요청할 수 있습니다.
              다만, 아래의 경우에는 청약철회가 제한됩니다:
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                <li>이미 서비스 이용(변환)을 1회 이상 사용한 경우</li>
                <li>
                  크레딧을 일부라도 사용한 경우 (미사용분에 한해 환불 가능)
                </li>
                <li>
                  「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에
                  해당하는 경우
                </li>
              </ul>
            </li>
            <li>
              환불 금액은 다음과 같이 산정합니다:
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                <li>미사용 크레딧: 전액 환불</li>
                <li>
                  부분 사용: (총 결제금액 - 사용 크레딧 × 건당 정가) 잔액 환불
                </li>
                <li>
                  월 구독: 결제일로부터 7일 이내 미사용 시 전액 환불, 사용
                  이력이 있는 경우 잔여 기간 일할 계산 환불
                </li>
              </ul>
            </li>
            <li>
              환불은 원래 결제 수단으로 처리되며, 카드 결제 취소의 경우
              카드사 사정에 따라 3~7영업일이 소요될 수 있습니다.
            </li>
            <li>
              환불 요청은 서비스 내 고객센터 또는 이메일(support@logos.builders)로
              접수할 수 있습니다.
            </li>
            <li>
              현재 서비스가 무료로 제공되는 기간에는 별도의 환불 대상이
              없습니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제9조 (교환 정책)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              본 서비스는 디지털 콘텐츠(AI 자동 생성 결과물) 제공 서비스로,
              물리적 상품이 아니므로 교환이 불가합니다.
            </li>
            <li>
              서비스 오류로 인해 정상적인 결과물이 생성되지 않은 경우, 동일
              건에 대해 재변환을 제공하며 크레딧은 차감되지 않습니다.
            </li>
            <li>
              생성된 결과물의 품질에 대한 불만은 교환 사유에 해당하지 않으나,
              고객센터를 통해 개선 요청을 접수할 수 있습니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제10조 (결제 취소 규정)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              결제 진행 중 취소: 결제창에서 취소 버튼을 통해 즉시 취소할 수
              있으며, 금액이 청구되지 않습니다.
            </li>
            <li>
              결제 완료 후 취소: 결제일로부터 7일 이내, 서비스 미사용 시 전액
              취소가 가능합니다.
            </li>
            <li>
              월 구독 해지: 다음 결제일 전까지 해지 요청 시 다음 회차부터
              결제가 중단되며, 잔여 기간 동안은 서비스를 계속 이용할 수
              있습니다.
            </li>
            <li>
              취소/해지 요청은 서비스 내 설정 메뉴 또는
              이메일(support@logos.builders)로 접수할 수 있습니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제11조 (이용자의 의무)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              이용자는 본인이 권리를 보유하거나 정당한 이용 허락을 받은 영상
              콘텐츠만 서비스에 입력해야 합니다.
            </li>
            <li>
              타인의 저작권, 초상권, 명예권 등을 침해하는 콘텐츠를 서비스에
              이용해서는 안 됩니다.
            </li>
            <li>
              서비스를 이용하여 생성된 콘텐츠의 활용에 대한 책임은 이용자에게
              있습니다.
            </li>
            <li>
              서비스의 정상적 운영을 방해하는 행위를 해서는 안 됩니다.
            </li>
            <li>
              계정 정보를 타인에게 양도하거나 공유해서는 안 됩니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제12조 (회사의 의무)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              회사는 관련 법령과 본 약관이 금지하는 행위를 하지 않으며, 지속적,
              안정적으로 서비스를 제공하기 위해 최선을 다합니다.
            </li>
            <li>
              회사는 이용자의 개인정보를 관련 법령에 따라 보호하며,
              개인정보처리방침에 따라 처리합니다.
            </li>
            <li>
              서비스 장애 발생 시 신속하게 복구하기 위해 노력합니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제13조 (지식재산권)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              서비스의 디자인, 소프트웨어, 기술 등에 대한 지식재산권은 회사에
              귀속됩니다.
            </li>
            <li>
              서비스를 통해 생성된 콘텐츠의 저작권은 이용자에게 귀속됩니다. 단,
              원본 영상의 저작권은 원저작자에게 있습니다.
            </li>
            <li>
              이용자는 서비스를 역설계, 디컴파일, 또는 기타 방법으로 소스코드를
              추출하려는 시도를 해서는 안 됩니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제14조 (서비스의 변경 및 중단)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              회사는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를
              변경할 수 있습니다.
            </li>
            <li>
              서비스 변경 시 변경 내용과 적용일자를 사전에 공지합니다.
            </li>
            <li>
              천재지변, 시스템 장애 등 불가항력적 사유로 서비스가 중단될 수
              있으며, 이 경우 회사는 지체 없이 복구에 노력합니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제15조 (이용 제한 및 계약 해지)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              회사는 이용자가 본 약관을 위반하거나 서비스 운영을 방해하는 경우
              서비스 이용을 제한하거나 이용계약을 해지할 수 있습니다.
            </li>
            <li>
              이용자는 언제든지 서비스 내 탈퇴 기능 또는 고객센터를 통해
              이용계약 해지를 요청할 수 있습니다.
            </li>
            <li>
              계약 해지 시 미사용 크레딧의 환불은 제8조에 따릅니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제16조 (면책조항)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              회사는 AI가 생성한 콘텐츠의 정확성, 완전성, 적법성을 보증하지
              않으며, 생성된 콘텐츠의 활용으로 인해 발생하는 문제에 대해 책임을
              지지 않습니다.
            </li>
            <li>
              서비스를 통해 생성된 콘텐츠의 검색엔진 노출 순위나 SEO 효과를
              보장하지 않습니다.
            </li>
            <li>
              이용자의 귀책사유로 인한 서비스 이용 장애에 대해 회사는 책임을
              지지 않습니다.
            </li>
            <li>
              회사는 무료로 제공되는 서비스에 대해 별도의 보증을 하지 않습니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제17조 (손해배상)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              회사 또는 이용자가 본 약관을 위반하여 상대방에게 손해를 입힌
              경우, 해당 당사자는 상대방에게 발생한 손해를 배상할 책임이
              있습니다.
            </li>
            <li>
              회사의 손해배상 범위는 이용자가 서비스 이용을 위해 지불한 금액을
              한도로 합니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제18조 (분쟁 해결)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              본 약관과 관련된 분쟁은 대한민국 법률을 적용하며, 회사의 본점
              소재지를 관할하는 법원을 전속적 합의관할 법원으로 합니다.
            </li>
            <li>
              회사와 이용자 간 분쟁이 발생한 경우, 양 당사자는 원만한 해결을
              위해 성실히 협의합니다.
            </li>
          </ol>
        </div>

        <div className="border-t pt-6 mt-8 text-xs text-gray-500 space-y-1">
          <p>
            <strong>부칙</strong>
          </p>
          <p>본 약관은 2025년 1월 18일부터 시행합니다.</p>
          <p className="mt-4">
            <strong>사업자 정보</strong>
          </p>
          <p>상호: 스터풀</p>
          <p>대표자: 조현웅</p>
          <p>사업자등록번호: 508-14-52353</p>
          <p>
            소재지: 경상남도 양산시 동면 금오16길 122, 513동 2202호
          </p>
          <p>연락처: 055-389-6223</p>
          <p>이메일: support@logos.builders</p>
        </div>
      </section>
    </main>
  );
}
