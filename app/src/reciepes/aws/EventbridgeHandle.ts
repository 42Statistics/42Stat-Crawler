import * as Eventbridge from '@aws-sdk/client-eventbridge';

const AWS_REGION = 'ap-northeast-2';

class EventbridgeHandle {
  private readonly eventbridgeClient: Eventbridge.EventBridgeClient;

  constructor(eventbridgeClient: Eventbridge.EventBridgeClient) {
    this.eventbridgeClient = eventbridgeClient;
  }

  async disableRule(rulename: string): Promise<void> {
    await this.eventbridgeClient.send(
      new Eventbridge.DisableRuleCommand({
        Name: rulename,
      })
    );
  }
}

export const createEventbridgeHandle = () => {
  const eventbridgeClient = new Eventbridge.EventBridgeClient({
    region: AWS_REGION,
  });

  return {
    eventbridgeHandle: new EventbridgeHandle(eventbridgeClient),
    [Symbol.dispose]: eventbridgeClient.destroy,
  };
};
