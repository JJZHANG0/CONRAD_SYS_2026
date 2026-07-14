import type { FieldReviewsMap } from "./review";

export interface LeanCanvas {
  id: number;
  team: number;
  problem: string;
  existing_alternatives: string;
  solution: string;
  key_metrics: string;
  unique_value_proposition: string;
  high_level_concept: string;
  sustainable_advantage: string;
  channels: string;
  customer_segments: string;
  early_adopters: string;
  cost_structure: string;
  revenue_streams: string;
  field_reviews?: FieldReviewsMap;
  completion_count: number;
  completion_rate: number;
  updated_at: string;
}

export interface BmcQuestionDef {
  id: keyof Omit<
    LeanCanvas,
    "id" | "team" | "field_reviews" | "completion_count" | "completion_rate" | "updated_at"
  >;
  q: number;
  titleEn: string;
  titleZh: string;
  maxWords: number;
  helper: string;
  helperZh: string;
}

export const BMC_QUESTIONS: BmcQuestionDef[] = [
  {
    id: "problem",
    q: 1,
    titleEn: "Problem",
    titleZh: "问题",
    maxWords: 40,
    helper: "What is the customer need the innovation will address? Is there a social or environmental challenge the team aims to take on?",
    helperZh: "这个创新方案要解决什么客户需求？团队是否希望应对某个社会问题或环境挑战？",
  },
  {
    id: "existing_alternatives",
    q: 2,
    titleEn: "Existing Alternatives",
    titleZh: "现有替代方案",
    maxWords: 40,
    helper: "How is this problem solved today? Consider other products in the market.",
    helperZh: "目前人们是如何解决这个问题的？市场上是否已经有类似产品、服务或替代方案？",
  },
  {
    id: "solution",
    q: 3,
    titleEn: "Solution",
    titleZh: "解决方案",
    maxWords: 40,
    helper: "What are the key characteristics of the innovation?",
    helperZh: "这个创新方案的核心特点是什么？它通过什么产品、技术、服务或系统来解决问题？",
  },
  {
    id: "key_metrics",
    q: 4,
    titleEn: "Key Metrics",
    titleZh: "关键指标",
    maxWords: 40,
    helper: "What are the most important numbers that track the innovation's success?",
    helperZh: "哪些数据最能衡量这个创新方案是否成功？例如用户数量、节省成本、使用频率、转化率、准确率、减排量等。",
  },
  {
    id: "unique_value_proposition",
    q: 5,
    titleEn: "Unique Value Proposition",
    titleZh: "独特价值主张",
    maxWords: 40,
    helper: "What makes the innovation different from what's already in the market?",
    helperZh: "相比市场上已有方案，这个创新方案最独特、最有吸引力的价值是什么？为什么用户会选择它？",
  },
  {
    id: "high_level_concept",
    q: 6,
    titleEn: "High-Level Concept",
    titleZh: "高层概念 / 一句话定位",
    maxWords: 10,
    helper: "What is the tagline of the innovation?",
    helperZh: "请用一句简短有力的话概括这个创新方案，可以理解为产品口号、宣传语或一句话定位。",
  },
  {
    id: "sustainable_advantage",
    q: 7,
    titleEn: "Sustainable Advantage",
    titleZh: "可持续竞争优势",
    maxWords: 40,
    helper: "Why will it be difficult for others to copy this innovation?",
    helperZh: "为什么其他团队或公司不容易复制这个创新方案？优势可以来自技术、数据、用户关系、设计、成本、专利、供应链或团队经验。",
  },
  {
    id: "channels",
    q: 8,
    titleEn: "Channels",
    titleZh: "渠道",
    maxWords: 40,
    helper: "How will the innovation be sold to customers? How will it be delivered?",
    helperZh: "这个创新方案将通过什么渠道触达、销售并交付给客户？例如官网、电商平台、学校合作、经销商、线下门店、App、订阅服务等。",
  },
  {
    id: "customer_segments",
    q: 9,
    titleEn: "Customer Segments",
    titleZh: "客户细分",
    maxWords: 40,
    helper: "Who is the target audience that is served by the innovation? Describe them.",
    helperZh: "这个创新方案主要服务哪些目标用户或客户群体？请描述他们的身份、需求、场景和特点。",
  },
  {
    id: "early_adopters",
    q: 10,
    titleEn: "Early Adopters",
    titleZh: "早期采用者",
    maxWords: 40,
    helper: "Who will be the very first customers? Describe them.",
    helperZh: "最有可能第一批尝试这个创新方案的人是谁？他们通常对问题更敏感、更愿意尝试新产品，或更迫切需要解决方案。",
  },
  {
    id: "cost_structure",
    q: 11,
    titleEn: "Cost Structure",
    titleZh: "成本结构",
    maxWords: 40,
    helper: "What are the most significant costs?",
    helperZh: "这个创新方案最主要的成本有哪些？例如研发成本、原材料成本、生产制造成本、人工成本、营销成本、物流成本、维护成本等。",
  },
  {
    id: "revenue_streams",
    q: 12,
    titleEn: "Revenue Streams",
    titleZh: "收入来源",
    maxWords: 40,
    helper: "How will the innovation make money to fund the operations on an ongoing basis?",
    helperZh: "这个创新方案如何持续获得收入，以支持长期运营？例如产品销售、订阅费、服务费、租赁费、授权费、配件耗材、企业合作等。",
  },
];
