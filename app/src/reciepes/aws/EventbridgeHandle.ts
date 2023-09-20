import * as Eventbridge from '@aws-sdk/client-eventbridge';

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

export class EventbridgeHandleProvider {
  private readonly region?: string;

  constructor(region?: string) {
    this.region = region;
  }

  async start(
    callback: (eventbridgeHandle: EventbridgeHandle) => unknown
  ): Promise<void> {
    const client = new Eventbridge.EventBridgeClient({ region: this.region });
    const eventbridgeHandle = new EventbridgeHandle(client);

    await callback(eventbridgeHandle);

    client.destroy();
  }
}
