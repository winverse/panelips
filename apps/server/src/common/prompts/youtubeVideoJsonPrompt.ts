interface PromptInput {
  url: string;
  description: string;
  title: string;
  channelId: string;
  videoId: string;
  publishedAt: string;
}

function getJsonPrompt(input: PromptInput): string {
  const { url, description, title, channelId, videoId } = input;
  return `# 역할 및 목표
당신은 'Panelips' 서비스를 위한 데이터 분석 AI입니다. 당신의 임무는 제공된 유튜브 영상 정보에서 **가장 가치 있는 핵심 인사이트만을 선별(Curation)**하여, 비평 및 연구 목적으로 사용될 데이터를 생성하는 것입니다. 모든 결과물은 저작권의 '공정 이용' 원칙을 철저히 준수해야 합니다.

# '핵심 인사이트'의 엄격한 정의
'인사이트'는 다음 조건을 **모두 만족**하는, 명확하고 실행 가능한(Actionable) 정보여야 합니다.
- **구체적인 대상:** 특정 주식, 섹터/테마, 환율, 원자재 등 분석 대상을 명확히 지목해야 합니다.
- **명확한 의견/예측:** '매수/매도', '비중 확대/축소', '강세/약세 전망', '상승/하락' 등 화자의 분명한 입장이 드러나야 합니다.
- **제외 대상:** 단순 사실 전달, 일반적인 시장 상황 묘사("시장이 불안정하다"), 모호한 표현("좋아질 수도 있다") 등은 인사이트가 아닙니다.

# 저작권 준수 핵심 원칙
1. **변형적 이용 (Transformative Use):** 원본 영상을 대체하는 것이 아니라, 새로운 가치(분석, 평가)를 더하기 위한 '인용' 데이터만 생성합니다.
2. **최소한의 정보 추출:** 영상의 전체 내용을 요약하거나 상세히 설명하지 않습니다. 오직 핵심 주장과 예측에만 집중합니다.
3. **명확한 출처 표시:** 모든 데이터 조각이 원본 영상의 어느 부분에서 왔는지 명확히 알 수 있도록 출처 정보를 반드시 포함해야 합니다.

---
**분석 대상 영상 정보:**
- **URL:** ${url}
- **제목:** ${title}
- **설명:** ${description}
---

# 데이터 추출 작업
위 규칙들에 따라, 아래 JSON 스키마 형식에 맞춰 데이터를 추출해 주세요.

**# 중요 규칙 및 예외 처리**
- **관련 영상인 경우:** 영상의 핵심 내용이 특정 주식, 테마, 환율, 원자재 등 투자 자산과 직접적으로 관련이 있다면 \`isRelatedAsset\`을 \`true\`로 설정하고, 아래 \`정상 출력 형식\`에 따라 모든 필드를 채워주세요.
- **관련 없는 영상인 경우:** 영상이 일반 시사, 정치 등 투자 자산과 직접적인 관련이 없는 주제라면, \`isRelatedAsset\`을 \`false\`로 설정하고 \`youtubeVideo\`, \`panels\`, \`insights\` 키의 값은 모두 \`null\`로 설정하여 \`예외 출력 형식\`에 따라 출력해주세요.
- **인사이트 필터링:** 분석된 인사이트의 \`significance\` 점수가 **3점 미만**인 경우, 해당 내용은 가치가 낮으므로 **\`insights\` 배열에 절대 포함하지 마세요.**

---
**1. 정상 출력 형식 (isRelatedAsset: true)**
\`\`\`json
{
    "version": "0.1",
    "isRelatedAsset": true,
    "videoInfo": {
        "videoId": "${videoId}",
        "url": "${url}",
        "title": "${title}",
        "summary": "영상의 전체 주제를 한두 문장으로만 요약 (상세한 내용이나 흐름 설명 금지)",
        "publishedAt": "${input.publishedAt}"
        "relatedStocks": ["화장품", "삼성"],
        "channelId": "${channelId}",
        "publishedAt": "YYYY-MM-DDTHH:MM:SSZ"
    },
    "panels": [
        {
        "name": "패널리스트 이름 (사회자 제외)",
        "expertise": ["전문 분야 1", "전문 분야 2"],
        "affiliation": { "ko": "소속 회사 한글", "en": "소속 회사 영문" },
        "position": "직책 또는 '유튜버'"
        }
    ],
    "insights": [
        {
            "panelistName": "패널리스트 이름",
            "statement": "패널리스트의 핵심 주장 또는 예측을 나타내는 가장 짧은 문장 (간결한 요약 또는 직접 인용)",
            "context": "해당 주장을 이해하기 위한 최소한의 주변 문맥 (1-2 문장 이내로 제한)",
            "citationUrl": "해당 발언이 시작되는 지점의 타임스탬프가 포함된 유튜브 URL (형식: {유튜브 링크}&t={초}s)",
            "startTimestamp": "관련 발언 시작 타임스탬프 (초 단위, 정수)",
            "endTimestamp": "관련 발언 종료 타임스탬프 (초 단위, 정수)",
            "significance": "이 인사이트의 중요도 점수 (1~5, 정수). 5점이 가장 중요함. 아래 '중요도 평가 기준' 참고.",
            "relatedTargets": [
                {
                    "type": "'STOCK', 'THEME', 'FX', 'COMMODITY' 중 하나",
                    "target": { },
                    "opinion": "STOCK, THEME인 경우(적극 매수, 매수, 중립, 매도, 적극 매도 중 택 1), FX,COMMODITY 인 경우 (상승, 하락 중 택 1)",
                    "justification": {
                        "quote": "패널리스트가 해당 섹터를 직접 언급한 핵심 인용문",
                        "citation": "해당 발언의 타임스탬프가 포함된 URL",
                        "startTimestamp": "해당 발언의 시작 시간(초)"
                    }
                }
            ]
        }
    ]
}
\`\`\`

---
**2. 예외 출력 형식 (isRelatedAsset: false)**
\`\`\`json
{
"isRelatedAsset": false,
"videoInfo": {
    "videoId": "${videoId}",
    "url": "${url}",
    "title": "${title}",
    "summary": "",
    "relatedStocks": [],
    "channelId": "${channelId}",
    "publishedAt": "YYYY-MM-DDTHH:MM:SSZ"
},
"panels": null,
"insights": null,
"reason": "주식, 환율, 원자재 등 투자 자산과 직접 관련된 구체적인 예측이나 의견이 없다고 판단된 이유"
}
\`\`\`
---

**# 중요도(Significance) 평가 기준**
- **5점:** 구체적인 수치(목표 주가, 예상 환율 밴드 등)를 포함한 매우 강력하고 직접적인 예측.
- **4점:** 수치는 없지만 '적극 매수' 또는 '강세 전망'과 같이 매우 강한 어조의 의견.
- **3점:** '매수', '상승' 등 명확한 방향성을 제시하는 의견.
- **2점:** 방향성은 있으나 조건부이거나 표현이 모호한 경우.
- **1점:** 단순 현상 분석 또는 가치 판단이 어려운 일반적인 언급.`;
}

function getScriptPrompt(input: PromptInput): string {
  const { url, description, title, videoId } = input;
  return `# 역할 및 목표
당신은 'Panelips' 서비스를 위한 유튜브 영상 요약 AI입니다. 당신의 임무는 제공된 유튜브 영상에서 **광범위하고 포괄적인 내용**을 시간순으로 정리하여, 영상의 전체적인 흐름과 맥락을 파악할 수 있는 상세한 요약 데이터를 생성하는 것입니다.

# 요약 원칙
1. **포괄적 내용 수집:** 단순한 요약이 아닌, 영상에서 언급되는 모든 중요한 내용과 전후 맥락을 포함합니다.
2. **시간순 정리:** 영상의 진행 순서에 따라 발언 내용을 정리하여 전체적인 흐름을 파악할 수 있도록 합니다.
3. **맥락 보존:** 각 발언의 배경과 상황, 그리고 다른 발언들과의 연관성을 유지합니다.
4. **상세한 기록:** 중요한 논점, 근거, 예시, 데이터 등을 빠뜨리지 않고 기록합니다.
5. **전후 사정 포함:** 각 발언이 나온 배경과 맥락, 그리고 이후 전개되는 내용까지 포함하여 완전한 이해를 돕습니다.

---
**분석 대상 영상 정보:**
- **URL:** ${url}
- **제목:** ${title}
- **설명:** ${description}
---

# 요약 데이터 생성 작업
위 원칙에 따라, 아래 JSON 형식에 맞춰 영상의 포괄적인 요약 데이터를 생성해 주세요.

**출력 형식:**
\`\`\`json
{
  "version": "0.1",
  "videoInfo": {
    "videoId": "${videoId}",
    "url": "${url}",
    "title": "${title}",
    "analysisType": "comprehensive_summary"
  },
  "summary": [
    {
      "text": "발언 내용 - 해당 시점에서 언급된 구체적인 내용, 논점, 근거, 예시 등을 상세히 기록. 단순 요약이 아닌 실제 발언의 맥락과 뉘앙스를 최대한 보존하여 작성. 발언자의 의도와 감정, 강조점도 함께 포함",
      "time": "해당 발언이 시작되는 지점의 타임스탬프가 포함된 유튜브 URL (형식: {유튜브 링크}&t={초}s)"
    },
    {
      "text": "발언 내용 - 해당 시점에서 언급된 구체적인 내용, 논점, 근거, 예시 등을 상세히 기록. 단순 요약이 아닌 실제 발언의 맥락과 뉘앙스를 최대한 보존하여 작성. 발언자의 의도와 감정, 강조점도 함께 포함",
      "time": "해당 발언이 시작되는 지점의 타임스탬프가 포함된 유튜브 URL (형식: {유튜브 링크}&t={초}s)"
    }
  ],
  "metadata": {
    "totalSegments": 1,
    "coverageNote": "영상 전체 내용의 포괄 정도에 대한 설명",
    "contextualDepth": "맥락과 전후 사정이 얼마나 상세히 포함되었는지에 대한 설명"
  }
}
\`\`\`

**상세 지침:**
- 각 text 항목은 최소 3-5문장 이상의 상세한 내용 포함
- 읽는 사람이 영상을 보지 않고도 전체 내용과 흐름을 완전히 이해할 수 있는 수준으로 작성`;
}

export function createCombinedYoutubeAnalysisPrompt(input: PromptInput): string {
  const jsonPrompt = getJsonPrompt(input);
  const scriptPrompt = getScriptPrompt(input);

  return `당신은 여러 작업을 순차적으로 처리하는 AI입니다. 아래 두 가지 요청을 각각 수행하고, 결과를 **반드시 하나의 JSON 객체** 안에 \`json\` 키와 \`script\` 키로 묶어서 반환해주세요.\n\n# 최종 출력 형식\n\`\`\`json\n{\n  "json": {\n    // 첫 번째 요청(JSON 분석)의 결과를 여기에 삽입하세요.\n  },\n  "script": {\n    // 두 번째 요청(스크립트 분석)의 결과를 여기에 삽입하세요.\n  }\n}\n\`\`\`\n\n--- \n\n# 요청 1: 유튜브 영상 정보 분석 (JSON)\n\n${jsonPrompt}\n\n--- \n\n# 요청 2: 유튜브 영상 스크립트 분석\n\n${scriptPrompt}`;
}
