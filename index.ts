import {shuffle} from 'lodash';
import {Twilio} from "twilio";

// Twilio is used to send SMS messages (https://www.twilio.com/try-twilio)
const twilioAccountSid = process.env['TWILIO_ACCOUNT_SID'];
const twilioAuthToken = process.env['TWILIO_AUTH_TOKEN']
const twilioPhoneNumber = process.env['TWILIO_PHONE_NUMBER']

// People names with their contact details
const people = [
    p("Jon Snow", "+48111222333", false),
    p("Arya Stark", "+48111222333", true),
    p("Cersei Lannister", "+48111222333", true),
    p("Tyrion Lannister", "+48111222333", false),
    p("Jaime Lannister", "+48111222333", false),
    p("Daenerys Targaryen", "+48111222333", true),
    p("Robb Stark", "+48111222333", false),
]

const lotteryResult = getLotteryPairs(people, 100, validatePairs)
sendMessages(lotteryResult).catch(error => console.log(error))

// You can change SMS message content here
function getMessage(giver: Person, giftee: Person) {
    return `Losowanie Świąteczne! Hej ${giver.name}! ${giver.isWoman ? 'Wylosowałas' : 'Wylosowałes'}: ${giftee!.name}. Składka wynosi 50zł. Liczba kontrolna: ${giftee!.controlNumber}.`
}

// The lottery result verification function.
// This implementation just checks if giver and giftee are different
function validatePairs(pairs: LotteryPairs) {
    for (const giver of pairs.keys()) {
        if (pairs.get(giver) === giver) return false;
    }
    return true;
}

type Person = {
    name: string;
    tel: string | null;
    isWoman: boolean;
    controlNumber?: number;
}

type LotteryPairs = Map<Person, Person>;

function getLotteryPairs(people: Person[], triesCount: number, validatePairs: (result: LotteryPairs) => boolean) {
    for (let j = 0; j < triesCount; j++) {
        const first = shuffle(people);
        const second = shuffle(people);

        const result = new Map<Person, Person>();
        for (let i = 0; i < people.length; i++) {
            first[i].controlNumber = i + 1;
            result.set(first[i], second[i]);
        }

        if (validatePairs(result)) {
            console.log(`Success in ${j + 1} tries.`)
            return result;
        }
    }

    throw new Error(`Unable to meet conditions in ${triesCount} tries`);
}

async function sendMessages(pairs: LotteryPairs) {
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        throw new Error("No twilio account details provided.")
    }

    const twilio = new Twilio(twilioAccountSid, twilioAuthToken);

    console.log("Sending messages")

    for (const giver of pairs.keys()) {
        if (giver.tel) {
            const giftee = pairs.get(giver);
            await twilio.messages
                .create({body: getMessage(giver, giftee!), from: twilioPhoneNumber, to: giver.tel})
        }
    }

    console.log("Messages sent successfully")
}

function p(name: string, tel: string | null, isWoman: boolean) {
    return {name, tel, isWoman};
}


