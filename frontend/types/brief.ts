import type { FieldReviewsMap } from "./review";

export interface InnovationBrief {
  id: number;
  team: number;
  elevator_pitch: string;
  team_overview: string;
  opportunity: string;
  key_metrics: string;
  validation_progress: string;
  market: string;
  competition: string;
  go_to_market: string;
  business_model: string;
  fundraising: string;
  field_reviews?: FieldReviewsMap;
  completion_count: number;
  completion_rate: number;
  updated_at: string;
}

export interface BriefQuestionDef {
  id: keyof Omit<
    InnovationBrief,
    "id" | "team" | "field_reviews" | "completion_count" | "completion_rate" | "updated_at"
  >;
  q: number;
  titleEn: string;
  titleZh: string;
  maxWords: number;
  helper: string;
}

/** Official Conrad Innovation Brief — 10 sections, 3,000 words total */
export const BRIEF_TOTAL_WORD_LIMIT = 3000;

export const BRIEF_QUESTIONS: BriefQuestionDef[] = [
  {
    id: "elevator_pitch",
    q: 1,
    titleEn: "Elevator Pitch",
    titleZh: "电梯演讲",
    maxWords: 150,
    helper: "Pitch the innovation, along with its impact, customers and business potential.",
  },
  {
    id: "team_overview",
    q: 2,
    titleEn: "Team",
    titleZh: "团队",
    maxWords: 150,
    helper:
      "How did the team form? What role will each team member play? What motivated the team to create the innovation? What special capabilities, resources or experiences does the team members bring?",
  },
  {
    id: "opportunity",
    q: 3,
    titleEn: "Opportunity",
    titleZh: "机会",
    maxWords: 300,
    helper: "What issue or pain point does the innovation address?",
  },
  {
    id: "key_metrics",
    q: 4,
    titleEn: "Key Metrics",
    titleZh: "关键指标",
    maxWords: 750,
    helper:
      "Describe the innovation, its design and its technology. How does it work? What is new or proprietary about the innovation? How does it meet needs and resolve pain points? What impact does the innovation create for individual users and humankind (qualitatively and quantitatively)? How can new or proprietary aspects be protected (patent, trade secret, copyright, etc.)?",
  },
  {
    id: "validation_progress",
    q: 5,
    titleEn: "Validation / Progress",
    titleZh: "验证与进展",
    maxWords: 450,
    helper:
      "How have you validated the innovation, technology, or processes? What progress has the team made in developing the innovation?",
  },
  {
    id: "market",
    q: 6,
    titleEn: "Market",
    titleZh: "市场",
    maxWords: 300,
    helper:
      "Describe the customer and the target segments. What is important to them? What is the size of the opportunity? Is the buyer or payer different from the customer? Describe the industry ecosystem.",
  },
  {
    id: "competition",
    q: 7,
    titleEn: "Competition",
    titleZh: "竞争",
    maxWords: 300,
    helper:
      "What competes with the innovation and how does the innovation compare? What are the advantages and disadvantages? What is the positioning?",
  },
  {
    id: "go_to_market",
    q: 8,
    titleEn: "Go-To-Market",
    titleZh: "市场进入策略",
    maxWords: 150,
    helper:
      "How will the team attract and sell to customers? Who are the best initial or pilot customers? Is the market best served through direct sales, distribution, licensing, strategic partnerships or other strategies?",
  },
  {
    id: "business_model",
    q: 9,
    titleEn: "Business Model",
    titleZh: "商业模式",
    maxWords: 300,
    helper:
      "What are the key revenues and costs? What are the pricing and costs to deliver one product or service unit?",
  },
  {
    id: "fundraising",
    q: 10,
    titleEn: "Fundraising",
    titleZh: "融资",
    maxWords: 150,
    helper:
      "What funds are needed to get started and how will those funds be used? How much will it cost to develop the product and roll out? What different sources will be pursued for funding and why are these a fit?",
  },
];
