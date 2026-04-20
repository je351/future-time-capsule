// app/terms/page.tsx  (또는 pages/terms.tsx)
// Future Time Capsule — 이용약관

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-sm leading-relaxed text-gray-700">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">이용약관</h1>
      <p className="text-gray-400 mb-10">시행일: 2026년 4월 1일</p>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">제1조 (목적)</h2>
        <p>
          이 약관은 넥스트스타(이하 "회사")가 운영하는 Future Time Capsule(이하 "서비스")의
          이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">제2조 (서비스 제공자 정보)</h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            {[
              ["상호명", "넥스트스타"],
              ["대표자", "송준철"],
              ["사업자등록번호", "365-86-03228"],
              ["주소", "서울특별시 양천구 목동중앙서로 3길 4 (1층 목동)"],
              ["고객문의", "je@nextstar.kr"],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-500 w-36">{label}</td>
                <td className="py-2 text-gray-800">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">제3조 (서비스 내용)</h2>
        <p className="mb-2">회사는 다음과 같은 서비스를 제공합니다.</p>
        <ol className="list-decimal list-inside space-y-1 pl-1">
          <li>미래의 나에게 편지를 작성하고 3일 후 이메일로 전달하는 서비스 (무료)</li>
          <li>미래의 나에게 편지를 작성하고 1주일 후 이메일로 전달하는 서비스 (유료, 1,000원)</li>
          <li>미래의 나에게 편지를 작성하고 1달 후 이메일로 전달하는 서비스 (유료, 1,000원)</li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">제4조 (서비스 이용)</h2>
        <ol className="list-decimal list-inside space-y-2 pl-1">
          <li>서비스는 별도의 회원가입 없이 이용할 수 있습니다.</li>
          <li>3일 후 도착 서비스는 무료로 이용할 수 있습니다.</li>
          <li>1주일 후, 1달 후 도착 서비스는 각 1,000원 결제 후 이용할 수 있습니다.</li>
          <li>편지 도착 시각은 한국 표준시(KST) 기준 오전 9시로 고정됩니다.</li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">제5조 (결제 및 환불)</h2>
        <ol className="list-decimal list-inside space-y-2 pl-1">
          <li>유료 서비스 이용 요금은 1,000원(부가세 포함)이며, 토스페이(Toss Payments)를 통해 결제됩니다.</li>
          <li>
            결제 완료 후 편지가 아직 발송되지 않은 경우, 고객문의 이메일을 통해 환불을
            요청하실 수 있습니다.
          </li>
          <li>편지 발송이 완료된 이후에는 환불이 불가합니다.</li>
          <li>
            이메일 주소 오입력 등 이용자 귀책사유로 인한 미전달에 대해서는 환불이 제한될 수
            있습니다.
          </li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">제6조 (이용자의 의무)</h2>
        <ol className="list-decimal list-inside space-y-2 pl-1">
          <li>이용자는 타인의 이메일 주소를 무단으로 사용하여서는 안 됩니다.</li>
          <li>
            이용자는 스팸, 광고, 불법 콘텐츠, 타인을 위협하거나 혐오하는 내용이 포함된 편지를
            발송하여서는 안 됩니다.
          </li>
          <li>
            위 사항을 위반한 경우 회사는 해당 편지의 발송을 취소하거나 법적 조치를 취할 수
            있습니다.
          </li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">제7조 (서비스 중단)</h2>
        <p>
          회사는 시스템 점검, 서버 장애, 천재지변 등 불가피한 사유가 발생한 경우 서비스 제공을
          일시 중단할 수 있습니다. 이 경우 회사는 이로 인해 발생한 손해에 대해 고의 또는 중대한
          과실이 없는 한 책임을 지지 않습니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">제8조 (면책조항)</h2>
        <ol className="list-decimal list-inside space-y-2 pl-1">
          <li>
            회사는 이용자가 입력한 이메일 주소 오류로 인한 미전달에 대해 책임을 지지 않습니다.
          </li>
          <li>
            수신자의 이메일 서비스 설정(스팸 필터 등)으로 인해 편지가 스팸함에 분류되는 경우
            회사는 책임을 지지 않습니다.
          </li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">제9조 (약관의 변경)</h2>
        <p>
          회사는 필요한 경우 약관을 변경할 수 있으며, 변경 시 서비스 내 공지를 통해 사전에
          안내합니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">제10조 (준거법 및 관할)</h2>
        <p>
          이 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련하여 발생한 분쟁은
          서울중앙지방법원을 제1심 관할법원으로 합니다.
        </p>
      </section>

      <p className="text-xs text-gray-400 mt-16 border-t border-gray-100 pt-6">
        문의: je@nextstar.kr
      </p>
    </main>
  );
}
