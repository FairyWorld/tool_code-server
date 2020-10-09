import { logger } from "@coder/logger"
import { spawn } from "child_process"
import path from "path"
import split2 from "split2"

const coderCloudAgent = path.resolve(__dirname, "../../lib/coder-cloud-agent")

function runAgent(...args: string[]): Promise<void> {
  logger.debug(`running agent with ${args}`)

  const agent = spawn(coderCloudAgent, args, {
    stdio: ["inherit", "inherit", "pipe"],
  })

  agent.stderr.pipe(split2()).on("data", (line) => {
    line = line.replace(/^[0-9-]+ [0-9:]+ [^ ]+\t/, "")
    logger.info(line)
  })

  return new Promise((res, rej) => {
    agent.on("error", rej)

    agent.on("close", (code) => {
      if (code !== 0) {
        rej({
          message: `coder cloud agent exited with ${code}`,
        })
        return
      }
      res()
    })
  })
}

export function coderCloudBind(csAddr: string, serverName = ""): Promise<void> {
  logger.info("Remember --link is a beta feature and requires being accepted for testing")
  logger.info("See https://github.com/cdr/code-server/discussions/2137")
  // addr needs to be in host:port format.
  // So we trim the protocol.
  csAddr = csAddr.replace(/^https?:\/\//, "")
  return runAgent("bind", `--code-server-addr=${csAddr}`, serverName)
}
