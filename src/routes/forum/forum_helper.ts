import { getConfig } from "../../lib/config.js";
import { ClarityValue, encodeStructuredDataBytes, publicKeyFromSignatureRsv, publicKeyToAddressSingleSig, stringAsciiCV, TupleCV, tupleCV, TupleData, uintCV, verifySignature } from "@stacks/transactions";
import { forumMessageBoardCollection, forumMessageCollection } from "../../lib/data/db_models.js";
import { bytesToHex, hexToBytes } from "@stacks/common";
import { sha256 } from "@noble/hashes/sha256";
import { ChainId } from "@stacks/network";
import type { AuthenticatedForumContent, AuthenticatedForumMessageBoard, BaseForumContent, ForumMessage, LinkedAccount, PostAuthorisation } from "sip18-forum-types";

export function buildTree(messages: AuthenticatedForumContent[]) {
  const map = new Map<string, AuthenticatedForumContent>();
  const roots: AuthenticatedForumContent[] = [];

  // Set up map
  for (const msg of messages) {
    // Ensure the forumContent has a `replies` array
    (msg.forumContent as any).replies = [];
    map.set(msg.forumContent.messageId, msg);
  }

  for (const msg of messages) {
    const parentId = msg.forumContent.parentId;
    if (parentId && map.has(parentId)) {
      const parent = map.get(parentId)!;
      (parent.forumContent as any).replies.push(msg);
    } else {
      roots.push(msg);
    }
  }

  return roots;
}

export async function saveMessageOrReply(messageBoard: AuthenticatedForumContent): Promise<boolean> {
  const result = await forumMessageCollection.insertOne(messageBoard);
  return result.insertedId ? true : false;
}

export async function saveMessageBoard(forumContent: AuthenticatedForumMessageBoard): Promise<boolean> {
  const result = await forumMessageBoardCollection.insertOne(forumContent);
  return result.insertedId ? true : false;
}

export function getPreferredLinkedAccount(linkedAccounts: Array<LinkedAccount>): LinkedAccount | undefined {
  return linkedAccounts.find((o) => o.preferred);
}

export function verifyPost(forumContent: BaseForumContent, auth: PostAuthorisation): boolean {
  try {
    const la = getPreferredLinkedAccount(forumContent.linkedAccounts);
    if (!la) return false;
    const stxAddressFromKey = getC32AddressFromPublicKey(auth.publicKey, getConfig().network);
    if (la.identifier !== stxAddressFromKey) {
      console.log("/polls: wrong voter: " + la.identifier + " signer: " + stxAddressFromKey);
      return false;
    }
    const forumPostCV = forumMessageToTupleCV(forumContent);

    let valid = verifyForumSignature(getConfig().network, getConfig().publicAppName, getConfig().publicAppVersion, forumPostCV, auth.publicKey, auth.signature);

    if (!valid) {
      console.warn("Signature verification failed");
      return false;
    }
    return true;
  } catch (err: any) {
    console.error("Post verification error:", err);
    throw new Error(`Post verification failed: ${err.message}`);
  }
}

// SIP-018 domain (must match client signing)
const domain = {
  name: "BigMarket Forum",
  version: "1.0.0",
  chainId: 1,
};

function forumMessageToTupleCV(message: BaseForumContent): TupleCV<TupleData<ClarityValue>> {
  const la = getPreferredLinkedAccount(message.linkedAccounts);
  if (!la) throw new Error("Unable to convert this message");
  return tupleCV({
    identifier: stringAsciiCV(la.identifier),
    created: uintCV(message.created),
    title: stringAsciiCV(message.title),
    content: stringAsciiCV(message.content),
    name: stringAsciiCV(la.displayName || "unknown"),
  });
}

function getC32AddressFromPublicKey(publicKeyHex: string, network: string): string {
  if (network === "mainnet" || network === "testnet" || network === "devnet") {
    const stacksAddress = publicKeyToAddressSingleSig(publicKeyHex, network);
    return stacksAddress;
  }
  return "unknown";
}

function verifyForumSignature(network: string, appName: string, appVersion: string, message: TupleCV<TupleData<ClarityValue>>, publicKey: string, signature: string): string | undefined {
  const chainId = network === "mainnet" ? ChainId.Mainnet : ChainId.Testnet;
  const domain = tupleCV({
    name: stringAsciiCV(appName),
    version: stringAsciiCV(appVersion),
    "chain-id": uintCV(chainId),
  });
  const structuredDataHash = bytesToHex(sha256(encodeStructuredDataBytes({ message, domain })));

  //console.log("signature.hash: " + structuredDataHash);

  const signatureBytes = hexToBytes(signature);
  const strippedSignature = signatureBytes.slice(0, -1);
  //console.log("Stripped Signature (Hex):", bytesToHex(strippedSignature));

  let pubkey: string = "-";
  let stacksAddress: string = "-";
  try {
    pubkey = publicKeyFromSignatureRsv(structuredDataHash, signature);

    if (network === "mainnet" || network === "testnet" || network === "devnet") {
      stacksAddress = publicKeyToAddressSingleSig(pubkey, network);
    }

    //console.log("sa: " + pubkey);
  } catch (err: any) {}
  //console.log("pubkey: " + pubkey);
  let result = false;
  try {
    result = verifySignature(bytesToHex(strippedSignature), structuredDataHash, publicKey);
    //console.log("verifySignatureRsv: result: " + result);
  } catch (err: any) {}
  return result ? stacksAddress : undefined;
}
