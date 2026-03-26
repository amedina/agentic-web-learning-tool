/**
 * External dependencies
 */
import Logger from "loglevel";

export default function logger(logTypes: string[], message: any[]) {
  logTypes.forEach((logType) => {
    //@ts-expect-error -- we are passing the function name to be called dynamically as this is a wrapper function
    Logger[logType](message.join(","));
  });
}
