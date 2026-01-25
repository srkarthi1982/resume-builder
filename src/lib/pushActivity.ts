import type { ResumeBuilderDashboardSummaryV1 } from "../dashboard/summary.schema";

const getWebhookUrl = (baseUrl: string) =>
  `${baseUrl.replace(/\/$/, "")}/api/webhooks/resume-builder-activity.json`;

type ResumeBuilderActivity = {
  event: string;
  occurredAt: string;
  entityId?: string;
};

export const pushResumeBuilderActivity = (params: {
  userId: string;
  activity: ResumeBuilderActivity;
  summary: ResumeBuilderDashboardSummaryV1;
}): void => {
  try {
    const baseUrl = import.meta.env.PARENT_APP_URL;
    const secret = import.meta.env.ANSIVERSA_WEBHOOK_SECRET;

    if (!baseUrl || !secret) {
      if (import.meta.env.DEV) {
        console.warn(
          "pushResumeBuilderActivity skipped: missing PARENT_APP_URL or ANSIVERSA_WEBHOOK_SECRET",
        );
      }
      return;
    }

    const url = getWebhookUrl(baseUrl);
    const payload = {
      userId: params.userId,
      appId: "resume-builder",
      activity: params.activity,
      summary: params.summary,
    };

    void fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ansiversa-Signature": secret,
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("pushResumeBuilderActivity failed", error);
    }
  }
};
