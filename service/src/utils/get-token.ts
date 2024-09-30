import axios from "axios";



const getColaToken = async () => {
    const {
        COLA_API_URL,
        COLA_USERNAME,
        COLA_PASSWORD,
    } = process.env.NODE_ENV === "development" ? process.env : process.env;

    if (
        !COLA_API_URL ||
        !COLA_USERNAME ||
        !COLA_PASSWORD
    ) {
        throw new Error("Get token: Cola credentials are missing.")
    }

    const { data } = await axios.post(`${COLA_API_URL}/api/tokenbazaar`, { username: COLA_USERNAME, pass: COLA_PASSWORD });

    return data.token;
};

export { getColaToken }