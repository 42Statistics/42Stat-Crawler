import * as Eventbridge from '@aws-sdk/client-eventbridge';
import { AWS_REGION } from '../../configs/aws/region.js';

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

export const createEventbridgeHandle = (): {
  eventbridgeHandle: EventbridgeHandle;
  [Symbol.dispose]: () => void;
} => {
  const eventbridgeClient = new Eventbridge.EventBridgeClient({
    region: AWS_REGION,
  });

  return {
    eventbridgeHandle: new EventbridgeHandle(eventbridgeClient),
    [Symbol.dispose]: (): void => eventbridgeClient.destroy(),
  };
};
