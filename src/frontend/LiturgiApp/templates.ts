import type { Template } from "../../types/Show"

export const LITURGI_APP_CATEGORY = {
    id: "liturgiapp",
    name: "LiturgiApp",
    icon: "presentation"
}

export function getLiturgiTemplates(): Record<string, Template> {
    return {
        dialog_liturgi: {
            isDefault: true,
            name: "Dialog Liturgi",
            color: "#0b6623",
            category: "liturgiapp",
            items: [
                // 1. Kartu / Box Putih (Latar Belakang Kontainer)
                {
                    style: "left:60px;top:50px;width:1800px;height:980px;background-color:#ffffff;border-radius:24px;box-shadow:0 10px 40px rgba(0,0,0,0.5);",
                    align: "",
                    lines: [{ align: "", text: [{ value: "", style: "" }] }]
                },
                // 2. Header Bagian Liturgi ("TAHBISAN")
                {
                    style: "left:140px;top:100px;width:1640px;height:90px;",
                    align: "",
                    lines: [
                        {
                            align: "text-align: left;",
                            text: [
                                {
                                    value: "TAHBISAN",
                                    style: "font-family: Arial, sans-serif;font-size: 55px;font-weight: bold;color: #0b6623;letter-spacing: 2px;text-transform: uppercase;"
                                }
                            ]
                        }
                    ]
                },
                // 3. Teks Dialog Responsif (P & J)
                {
                    style: "left:140px;top:220px;width:1640px;height:750px;",
                    align: "",
                    specialStyle: {
                        firstLineIndent: 0,
                        hangingIndent: 90,
                        tabStops: [90]
                    },
                    lines: [
                        {
                            align: "text-align: left;",
                            text: [
                                {
                                    value: "P:\t",
                                    style: "font-family: Arial, sans-serif;font-weight: bold;font-size: 62px;color: #000000;line-height: 1.45em;"
                                },
                                {
                                    value: "Pertolongan kepada kita adalah dalam nama TUHAN, Allah Pencipta langit dan bumi, yang memelihara kesetiaan-Nya sampai selama-lamanya dan tidak meninggalkan perbuatan tangan-Nya.",
                                    style: "font-family: Arial, sans-serif;font-weight: normal;font-size: 62px;color: #111111;line-height: 1.45em;"
                                }
                            ]
                        },
                        {
                            align: "text-align: left;",
                            text: [{ value: "", style: "font-size: 30px;" }]
                        },
                        {
                            align: "text-align: left;",
                            text: [
                                {
                                    value: "J:\t",
                                    style: "font-family: Arial, sans-serif;font-weight: bold;font-size: 62px;color: #000000;line-height: 1.45em;"
                                },
                                {
                                    value: "Amin.",
                                    style: "font-family: Arial, sans-serif;font-weight: bold;font-size: 62px;color: #000000;line-height: 1.45em;"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }
}
