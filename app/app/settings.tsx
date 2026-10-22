import { Body, Heading, Screen } from '../src/components/ui';
export default function Settings() { return <Screen><Heading>Your words stay with you</Heading><Body>Your journal is stored on this device in SQLite. Local storage is protected by the app sandbox, but is not separately encrypted by dirabl.</Body></Screen>; }
