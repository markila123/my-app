// Native (iOS/Android) implementation: re-export from the actual library
import NetworkLogger, {
  startNetworkLogging,
} from "react-native-network-logger";

export { startNetworkLogging };
export default NetworkLogger;
