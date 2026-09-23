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
                // 1. Judul Header Liturgi ("Tahbisan")
                {
                    style: "left:140px;top:100px;width:1640px;height:90px;",
                    align: "",
                    lines: [
                        {
                            align: "text-align: left;",
                            text: [
                                {
                                    style: "font-weight: bold;color: #0b6623;letter-spacing: 2px;font-family:'Fractul';font-size:92px;text-shadow:0 0 0 rgb(0 0 0 / 0);",
                                    value: "Tahbisan"
                                }
                            ]
                        }
                    ],
                    auto: false
                },
                // 2. Isi Teks Dialog Pelayan (P)
                {
                    style: "left:282.00px;width:1498.00px;height:494.58px;top:292.71px;",
                    align: "align-items:flex-start;",
                    lines: [
                        {
                            align: "text-align: left;",
                            text: [
                                {
                                    style: "font-family: Arial, sans-serif;line-height: 1.45em;font-size:86px;color:#000000;text-shadow:0 0 0 rgb(0 0 0 / 0);",
                                    value: "Pertolongan kepada kita adalah dalam nama TUHAN, Allah Pencipta langit dan bumi, yang memelihara kesetiaan-Nya sampai selama-lamanya dan tidak meninggalkan perbuatan tangan-Nya."
                                }
                            ]
                        }
                    ],
                    list: {
                        enabled: false
                    },
                    auto: false
                },
                // 3. Label Jemaat ("J:")
                {
                    style: "width:117.25px;height:81.00px;top:794.75px;left:141px;",
                    align: "align-items:flex-start;",
                    lines: [
                        {
                            align: "text-align: left;",
                            text: [
                                {
                                    style: "font-family: Arial, sans-serif;font-weight: bold;line-height: 1.45em;font-size:86px;color:#000000;text-shadow:0 0 0 rgb(0 0 0 / 0);",
                                    value: "J:"
                                }
                            ]
                        }
                    ],
                    auto: false
                },
                // 4. Isi Teks Dialog Jemaat (J - "Amin")
                {
                    style: "height:80.25px;width:1281.10px;top:795.50px;left:498.90px;",
                    type: "text",
                    align: "",
                    lines: [
                        {
                            align: "text-align: left;",
                            text: [
                                {
                                    style: "font-family: Arial, sans-serif;font-weight: bold;line-height: 1.45em;font-size:86px;color:#000000;text-shadow:0 0 0 rgb(0 0 0 / 0);",
                                    value: "Amin"
                                }
                            ]
                        }
                    ],
                    auto: false
                },
                // 5. Label Pelayan ("P:")
                {
                    style: "left:140.00px;width:117.25px;height:81.00px;top:292.71px;",
                    align: "align-items:flex-start;",
                    lines: [
                        {
                            align: "text-align: left;",
                            text: [
                                {
                                    style: "font-family: Arial, sans-serif;font-weight: bold;line-height: 1.45em;font-size:86px;color:#000000;text-shadow:0 0 0 rgb(0 0 0 / 0);",
                                    value: "P:"
                                }
                            ]
                        }
                    ],
                    auto: false
                }
            ]
        }
    }
}
