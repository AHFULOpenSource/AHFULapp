import { setSettings } from './SettingsSlice.jsx';

export async function FetchUserSettings(dispatch) {
    const foundUserSettingsResponse = await fetch(`http://localhost:5000/api/AHFULuserSettings`, {
        method: "GET",
        credentials: "include",
    });

    if (foundUserSettingsResponse.ok) {
        const settingsJson = await foundUserSettingsResponse.json();
        dispatch(setSettings(settingsJson));
        return settingsJson;
    }

    throw new Error(
        "Failed to fetch settings: " + foundUserSettingsResponse.status,
    );
}