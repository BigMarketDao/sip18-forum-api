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

export async function fetchThreadRecursive(messageId: string, depth = 0, maxDepth = 10): Promise<AuthenticatedForumContent | null> {
  if (depth > maxDepth) return null;

  // 1. Fetch the root message
  const root = await forumMessageCollection.findOne<AuthenticatedForumContent>({
    "forumContent.messageId": messageId,
  });
  if (!root) return null;

  // 2. Fetch direct children
  const children = await forumMessageCollection.find({ "forumContent.parentId": messageId }).sort({ "forumContent.created": -1 }).toArray();

  // 3. Recursively attach replies
  for (const child of children) {
    const childTree = await fetchThreadRecursive(child.forumContent.messageId, depth + 1, maxDepth);
    if (childTree) {
      if (!root.forumContent.replies) root.forumContent.replies = [];
      root.forumContent.replies.push(childTree);
    }
  }

  //root.forumContent.replies?.sort((a, b) => b.forumContent.created - a.forumContent.created);

  return root;
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
    console.log("verifyPost: " + getConfig().network + " : " + getConfig().publicAppName + " : " + getConfig().publicAppVersion);
    //console.log("verifyPost: ", forumPostCV);

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
  const signatureBytes = hexToBytes(signature);
  const strippedSignature = signatureBytes.slice(0, -1);
  let pubkey: string = "-";
  let stacksAddress: string = "-";
  try {
    pubkey = publicKeyFromSignatureRsv(structuredDataHash, signature);

    if (network === "mainnet" || network === "testnet" || network === "devnet") {
      stacksAddress = publicKeyToAddressSingleSig(pubkey, network);
    }
  } catch (err: any) {}
  let result = false;
  try {
    result = verifySignature(bytesToHex(strippedSignature), structuredDataHash, publicKey);
  } catch (err: any) {}
  return result ? stacksAddress : undefined;
}
