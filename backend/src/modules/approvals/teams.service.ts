import { prisma } from '../../common/db/prisma.js';

export async function sendTeamsApprovalCard(goalId: string, managerId: string) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId }, include: { employee: true } });
  if (!goal) return;

  const employeeName = goal.employee.name;

  const manager = await prisma.user.findUnique({ where: { id: managerId } });
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('[TEAMS WEBHOOK] Adaptive Card generated (Mocked - No WEBHOOK_URL set):', {
      employee: employeeName,
      goalTitle: goal.title,
      target: goal.target_value,
    });
    return;
  }

  const backendUrl = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

  const adaptiveCard = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              size: 'Medium',
              weight: 'Bolder',
              text: `Goal Approval Request: ${employeeName}`
            },
            {
              type: 'TextBlock',
              text: `**Title:** ${goal.title}`,
              wrap: true
            },
            {
              type: 'TextBlock',
              text: `**Description:** ${goal.description || 'No description provided.'}`,
              wrap: true
            },
            {
              type: 'FactSet',
              facts: [
                { title: 'Target:', value: `${goal.target_value} ${goal.uom_type}` },
                { title: 'Weightage:', value: `${goal.weightage}%` },
                { title: 'Category:', value: goal.category }
              ]
            }
          ],
          actions: [
            {
              type: 'Action.Http',
              title: 'Approve',
              method: 'POST',
              url: `${backendUrl}/approvals/webhook/teams`,
              body: JSON.stringify({ action: 'approve', goalId: goal.id, managerId }),
              headers: [
                { name: 'Content-Type', value: 'application/json' }
              ]
            },
            {
              type: 'Action.Http',
              title: 'Reject',
              method: 'POST',
              url: `${backendUrl}/approvals/webhook/teams`,
              body: JSON.stringify({ action: 'reject', goalId: goal.id, managerId }),
              headers: [
                { name: 'Content-Type', value: 'application/json' }
              ]
            }
          ]
        }
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adaptiveCard)
    });
    
    if (!response.ok) {
      console.error('[TEAMS WEBHOOK ERROR] Failed to send card:', await response.text());
    } else {
      console.log(`[TEAMS WEBHOOK SUCCESS] Sent approval card to manager ${manager?.name} for goal ${goalId}`);
    }
  } catch (error) {
    console.error('[TEAMS WEBHOOK ERROR] Exception during fetch:', error);
  }
}
