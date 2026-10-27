// Shared, localized instructions for the exact download format. No release authority.
export const installCopy = {
  ko: {
    title: '다운로드·설치 안내', short: '설치 방법', intro: '내 기기에 맞는 파일을 받고, 아래 순서대로 시작하세요.',
    pending: '이 OS의 설치 파일은 준비 중입니다. 공개되면 아래 방법으로 설치할 수 있습니다.',
    seo: '공개된 설치 파일과 macOS·Windows·Linux별 설치 방법을 확인하세요.',
    macTitle: 'macOS에서 시작하기', windowsTitle: 'Windows에서 시작하기', linuxTitle: 'Linux에서 시작하기',
    download: '공식 파일 다운로드', macDownload: '이 페이지에서 최신 DMG 파일을 내려받아 더블 클릭하세요.',
    macZip: '이 페이지에서 받은 ZIP 파일을 더블 클릭하여 앱의 압축을 푸세요.',
    macCopyTitle: '응용 프로그램으로 복사', macCopy: '{app} 앱을 Applications(응용 프로그램) 폴더로 드래그하세요. 복사가 끝나면 그 폴더에서 앱을 실행하세요.',
    macOpenTitle: '첫 실행 확인', macOpen: '인터넷에서 내려받은 앱이라는 확인 창이 나오면 앱 이름을 확인한 뒤 “열기”를 선택하세요.',
    macBlockedTitle: '개발자 확인으로 차단될 때만', macBlocked: '공식 파일인지 확인하고 앱 실행을 한 번 시도한 뒤, 시스템 설정 → 개인정보 보호 및 보안에서 해당 앱의 “확인 없이 열기”를 선택하세요. 다시 표시되는 창에서 앱 이름을 확인하세요.',
    macDamaged: '“앱이 손상되었습니다” 또는 컴퓨터를 손상시킨다는 경고가 나오면 실행을 진행하지 말고, 이 공식 페이지에서 최신 파일을 다시 받으세요. 계속되면 웹 버전을 이용하거나 지원팀에 문의하세요.',
    unzipTitle: '먼저 모두 압축 풀기', unzip: 'ZIP 파일을 마우스 오른쪽 버튼으로 클릭하고 “모두 압축 풀기”를 선택하세요. ZIP 안에서 바로 실행하지 말고, 압축을 푼 폴더를 여세요.',
    installerTitle: '설치 프로그램 실행', installer: '{app}의 {format} 설치 파일을 열고 화면의 설치 안내를 따르세요.',
    windowsUnknown: 'ZIP이면 먼저 “모두 압축 풀기”를 사용하세요. 동봉된 MSI·설치용 EXE는 설치 안내를 따르고, 설치가 필요 없는 앱은 압축을 푼 폴더에서 실행하세요.',
    portableTitle: '압축을 푼 앱 실행', portable: '압축을 푼 폴더에서 {app}.exe를 실행하세요. 함께 들어 있는 파일은 같은 폴더에 보관하세요.',
    bundle: 'MSI와 CAB 파일을 모두 같은 폴더에 둔 상태에서 MSI를 실행하세요. CAB 파일을 따로 옮기거나 MSI만 복사하지 마세요.',
    windowsOpenTitle: '앱 열기', windowsOpen: '설치가 끝나면 시작 메뉴에서 {app}를 찾아 실행하세요. 회사에서 관리하는 PC에 설치 권한이 없으면 관리자에게 문의하세요.',
    windowsNotice: '확인 창이 표시되면 다운로드한 제품과 파일 이름을 확인하세요. 문제가 있으면 공식 최신 파일을 다시 받거나 웹 버전을 이용하세요.',
    linuxDownload: '이 페이지에서 내 기기용 AppImage 파일을 내려받으세요. 별도 압축 해제나 설치 프로그램은 필요하지 않습니다.',
    linuxPermissionTitle: '이 파일의 실행 허용', linuxPermission: '파일을 마우스 오른쪽 버튼으로 클릭해 속성 → 권한에서 “프로그램으로 실행 허용” 또는 “실행 가능”을 선택하세요. 이름은 파일 관리자에 따라 다릅니다.',
    linuxRunTitle: 'AppImage 실행', linuxRun: '설정을 닫고 AppImage 파일을 더블 클릭하세요.', linuxTerminal: '터미널에서는 파일이 있는 폴더에서 아래 명령으로도 실행할 수 있습니다.',
    linuxHelp: '실행되지 않으면 사용 중인 배포판의 AppImage/FUSE 지원을 확인하세요. 운영체제 지원 안내를 참고하거나 웹 버전을 이용할 수 있습니다.',
    apple: 'Apple 공식 안내', microsoft: 'Microsoft 공식 안내', appimage: 'AppImage 공식 안내', unzipHelp: 'ZIP 압축 풀기 안내',
  },
  en: {
    title: 'Download & installation guide', short: 'How to install', intro: 'Choose the file for your device, then follow these steps.',
    pending: 'The installer for this OS is being prepared. These steps will apply when it is released.',
    seo: 'Find published downloads and installation steps for macOS, Windows and Linux.',
    macTitle: 'Get started on macOS', windowsTitle: 'Get started on Windows', linuxTitle: 'Get started on Linux',
    download: 'Download the official file', macDownload: 'Download the latest DMG from this page and double-click it.',
    macZip: 'Double-click the ZIP downloaded from this page to extract the app.',
    macCopyTitle: 'Copy to Applications', macCopy: 'Drag {app} to your Applications folder. When copying finishes, open the app from that folder.',
    macOpenTitle: 'Confirm the first launch', macOpen: 'If macOS asks about an app downloaded from the internet, check the app name and choose Open.',
    macBlockedTitle: 'Only if developer verification blocks it', macBlocked: 'Check that the file came from this official page and try opening it once. In System Settings → Privacy & Security, use Open Anyway for this app only. Check the app name in the next confirmation.',
    macDamaged: 'If macOS says the app is damaged or will damage your computer, stop and download the latest file from this official page again. If it continues, use the web app or contact support.',
    unzipTitle: 'Extract everything first', unzip: 'Right-click the ZIP and choose Extract All. Open the extracted folder; do not run the app from inside the ZIP.',
    installerTitle: 'Run the installer', installer: 'Open the {format} installer for {app} and follow its installation steps.',
    windowsUnknown: 'For a ZIP, use Extract All first. Run the included MSI or setup EXE to install, or open a portable app from the extracted folder.',
    portableTitle: 'Open the extracted app', portable: 'Run {app}.exe in the extracted folder. Keep its accompanying files in that same folder.',
    bundle: 'Keep the MSI and every CAB file together in the extracted folder, then run the MSI. Do not move the CAB files or copy the MSI on its own.',
    windowsOpenTitle: 'Open the app', windowsOpen: 'After installation, find {app} in the Start menu. On a managed work PC, ask your administrator if you do not have installation permission.',
    windowsNotice: 'If a confirmation appears, check the product and downloaded filename. If something is wrong, download the latest official file again or use the web app.',
    linuxDownload: 'Download the AppImage for your device from this page. No archive extraction or separate installer is needed.',
    linuxPermissionTitle: 'Allow this file to run', linuxPermission: 'Right-click the file and open Properties → Permissions. Select Allow executing file as program or Is executable; the label depends on your file manager.',
    linuxRunTitle: 'Run the AppImage', linuxRun: 'Close the settings and double-click the AppImage.', linuxTerminal: 'You can also use the commands below in a terminal opened in its folder.',
    linuxHelp: 'If it does not start, check AppImage/FUSE support for your Linux distribution. Consult the official guide or use the web app.',
    apple: 'Official Apple guide', microsoft: 'Official Microsoft guide', appimage: 'Official AppImage guide', unzipHelp: 'How to extract ZIP files',
  },
  ja: {
    title: 'ダウンロード・インストールガイド', short: 'インストール方法', intro: 'お使いの端末に合うファイルを選び、次の手順で始めましょう。',
    pending: 'このOS向けのファイルは準備中です。公開後は次の手順でインストールできます。',
    seo: '公開済みファイルとmacOS・Windows・Linuxのインストール方法をご案内します。',
    macTitle: 'macOSで始める', windowsTitle: 'Windowsで始める', linuxTitle: 'Linuxで始める',
    download: '公式ファイルをダウンロード', macDownload: 'このページから最新のDMGをダウンロードし、ダブルクリックします。',
    macZip: 'このページからダウンロードしたZIPをダブルクリックし、アプリを展開します。',
    macCopyTitle: 'アプリケーションにコピー', macCopy: '{app}をApplications（アプリケーション）フォルダへドラッグします。コピーが終わったら、そのフォルダから起動してください。',
    macOpenTitle: '初回起動を確認', macOpen: 'インターネットからダウンロードしたアプリの確認画面が出たら、アプリ名を確認して「開く」を選びます。',
    macBlockedTitle: '開発元の確認でブロックされた場合のみ', macBlocked: '公式ファイルであることを確認し、一度起動を試してください。「システム設定」→「プライバシーとセキュリティ」で、このアプリだけの「このまま開く」を選びます。次の確認画面でもアプリ名を確かめてください。',
    macDamaged: '「アプリが破損している」またはコンピュータに損害を与えるという警告の場合は実行を中止し、この公式ページから最新版を再ダウンロードしてください。続く場合はウェブ版を利用するか、サポートにお問い合わせください。',
    unzipTitle: '先にすべて展開', unzip: 'ZIPを右クリックして「すべて展開」を選びます。ZIP内から直接実行せず、展開したフォルダを開いてください。',
    installerTitle: 'インストーラーを実行', installer: '{app}の{format}インストーラーを開き、画面の案内に従います。',
    windowsUnknown: 'ZIPは先に「すべて展開」を使ってください。同梱のMSIやセットアップ用EXEは案内に従ってインストールし、ポータブル版は展開したフォルダから起動します。',
    portableTitle: '展開したアプリを起動', portable: '展開したフォルダ内の{app}.exeを実行します。同梱ファイルは同じフォルダに保管してください。',
    bundle: 'MSIとすべてのCABを展開先の同じフォルダに置いたままMSIを実行します。CABを移動したり、MSIだけをコピーしたりしないでください。',
    windowsOpenTitle: 'アプリを開く', windowsOpen: 'インストール後、スタートメニューで{app}を探して起動します。会社管理のPCで権限がない場合は管理者にご相談ください。',
    windowsNotice: '確認画面が出たら、製品名とダウンロードしたファイル名を確認してください。問題がある場合は公式最新版を再ダウンロードするか、ウェブ版をご利用ください。',
    linuxDownload: 'このページからお使いの端末用のAppImageをダウンロードします。展開や別のインストーラーは不要です。',
    linuxPermissionTitle: 'このファイルの実行を許可', linuxPermission: 'ファイルを右クリックし「プロパティ」→「アクセス権」で「プログラムとして実行を許可」または「実行可能」を選びます。表示名はファイルマネージャーによって異なります。',
    linuxRunTitle: 'AppImageを起動', linuxRun: '設定を閉じてAppImageをダブルクリックします。', linuxTerminal: 'ファイルのあるフォルダでターミナルを開き、下のコマンドでも実行できます。',
    linuxHelp: '起動しない場合は、ご利用のディストリビューションのAppImage/FUSE対応を確認してください。公式ガイドやウェブ版も利用できます。',
    apple: 'Apple公式ガイド', microsoft: 'Microsoft公式ガイド', appimage: 'AppImage公式ガイド', unzipHelp: 'ZIPの展開方法',
  },
};

export function installationGuide(lang, platform, artifact, product) {
  const t = installCopy[lang], app = `VORA ${product.toUpperCase()}`;
  if (!t || !['macos','windows','linux'].includes(platform) || !['word','slide','cell','hwp'].includes(product)) throw new Error('Unknown installation guide');
  const step = (title, text) => ({title, text:text.replaceAll('{app}', app).replaceAll('{format}', artifact?.format === 'zip' ? 'MSI' : (artifact?.format || 'MSI / EXE').toUpperCase())});
  const locale = {ko:'ko-kr',en:'en-us',ja:'ja-jp'}[lang];
  if (platform === 'macos') return {title:t.macTitle, steps:[step(t.download,artifact?.format === 'zip' ? t.macZip : t.macDownload),step(t.macCopyTitle,t.macCopy),step(t.macOpenTitle,t.macOpen),step(t.macBlockedTitle,t.macBlocked)], note:t.macDamaged,
    links:[[t.apple,`https://support.apple.com/${locale}/102445`]]};
  if (platform === 'windows') {
    const zip = artifact?.format === 'zip', portable = zip && product === 'hwp';
    const steps = [step(zip ? t.unzipTitle : t.download,zip ? t.unzip : artifact ? t.installer : t.windowsUnknown)];
    if (zip) steps.push(step(portable ? t.portableTitle : t.installerTitle, portable ? t.portable : t.installer));
    if (!portable && artifact) steps.push(step(t.windowsOpenTitle,t.windowsOpen));
    return {title:t.windowsTitle,steps,note:artifact?.bundleKind === 'windows-msi-cab-v1' ? `${t.bundle} ${t.windowsNotice}` : t.windowsNotice,
      links:[[t.microsoft,`https://support.microsoft.com/${locale}/windows/apps/how-to-install-programs-from-online-sources-on-windows`],[t.unzipHelp,`https://support.microsoft.com/${locale}/windows/experience/storage-filemanagement/zip-and-unzip-files`]]};
  }
  const filename = artifact?.url?.split('/').pop();
  // Only validated public artifacts supply executable examples; no arbitrary shell input.
  const command = filename && /^VORA-(WORD|SLIDE|CELL|HWP)-[0-9.]+-linux-x64\.AppImage$/.test(filename)
    ? `chmod +x "${filename}"\n./"${filename}"` : null;
  return {title:t.linuxTitle,steps:[step(t.download,t.linuxDownload),step(t.linuxPermissionTitle,t.linuxPermission),step(t.linuxRunTitle,t.linuxRun+(command?' '+t.linuxTerminal:''))],note:t.linuxHelp,command,
    links:[[t.appimage,'https://docs.appimage.org/introduction/quickstart.html']]};
}

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderInstallGuide(lang, platform, artifact, product, {compact=false, pending=false, open=false}={}) {
  const t=installCopy[lang], guide=installationGuide(lang,platform,artifact,product), id=`${compact?'dialog-':''}${platform}-install`;
  return `<details id="${id}" class="installation-guide${compact?' compact':''}" data-platform="${platform}"${open?' open':''}><summary><span class="os-logo os-${platform}" aria-hidden="true"></span><span>${escape(guide.title)}</span><span class="guide-chevron" aria-hidden="true">+</span></summary><div class="guide-body">${pending?`<p class="guide-pending">${escape(t.pending)}</p>`:''}<ol>${guide.steps.map((step,index)=>`<li><span class="guide-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div><h4>${escape(step.title)}</h4><p>${escape(step.text)}</p></div></li>`).join('')}</ol>${guide.command?`<pre><code>${escape(guide.command)}</code></pre>`:''}<p class="guide-note">${escape(guide.note)}</p><div class="guide-links">${guide.links.map(([label,url])=>`<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`).join('')}</div></div></details>`;
}
