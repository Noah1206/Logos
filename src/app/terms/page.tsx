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
            제6조 (크레딧 및 결제)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              서비스는 크레딧 기반 종량제로 운영되며, 1회 변환 시 1크레딧이
              차감됩니다.
            </li>
            <li>
              신규 회원에게는 무료 체험용 크레딧이 제공될 수 있으며, 제공 수량은
              회사가 정합니다.
            </li>
            <li>
              크레딧 구매는 회사가 정한 결제수단(신용카드, 간편결제 등)을 통해
              이루어집니다.
            </li>
            <li>
              구매한 크레딧의 유효기간은 구매일로부터 1년이며, 유효기간 만료 시
              소멸됩니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제7조 (환불 정책)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              미사용 크레딧에 한하여 구매일로부터 7일 이내에 환불을 요청할 수
              있습니다.
            </li>
            <li>
              이미 사용한 크레딧은 환불 대상에서 제외되며, 부분 사용 시 사용분을
              제외한 나머지 금액이 환불됩니다.
            </li>
            <li>
              무료로 제공된 크레딧은 환불 대상이 아닙니다.
            </li>
            <li>
              환불은 원래 결제수단으로 처리되며, 처리 기간은 결제수단에 따라
              영업일 기준 3~7일이 소요될 수 있습니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제8조 (이용자의 의무)
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
            제9조 (회사의 의무)
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
            제10조 (지식재산권)
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
            제11조 (서비스의 변경 및 중단)
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
            제12조 (이용 제한 및 계약 해지)
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
              계약 해지 시 미사용 크레딧의 환불은 제7조에 따릅니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            제13조 (면책조항)
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
            제14조 (손해배상)
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
            제15조 (분쟁 해결)
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
          <p>본 약관은 2024년 1월 18일부터 시행합니다.</p>
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
