import { setSettings } from './SettingsSlice.jsx';

export async function FetchUserSettings(dispatch) {
    const foundUserSettingsResponse = await fetch(`https://www.ahful.app/api/AHFULuserSettings`, {
        method: "GET",
        credentials: "include",
    });

    if (foundUserSettingsResponse){
        const settingsJson = await foundUserSettingsResponse.json();
        
        // console.log("WhoAmI: Found User Settings Response:", settingsJson);
        dispatch(setSettings(settingsJson));
    }else{
        throw new Error(
        "Failed to fetch settings" + foundUserSettingsResponse.status,
        );
    }
}