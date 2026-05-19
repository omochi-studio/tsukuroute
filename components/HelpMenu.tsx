"use client";

import { useState } from "react";

type Props = {
    feedbackUrl: string;
};

export default function HelpMenu({ feedbackUrl }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-16 right-4 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
                >
                    ヘルプ
                </button>

                {isOpen && (
                    <div className="absolute bottom-12 right-0 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                        <button
                            onClick={() => {
                                setIsGuideOpen(true);
                                setIsOpen(false);
                            }}
                            className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-100"
                        >
                            使い方
                        </button>

                        <button
                            onClick={() => {
                                setIsTermsOpen(true);
                                setIsOpen(false);
                            }}
                            className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-100"
                        >
                            利用規約
                        </button>

                        <button
                            onClick={() => {
                                window.open(feedbackUrl, "_blank");
                                setIsOpen(false);
                            }}
                            className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-100"
                        >
                            意見・要望
                        </button>

                    </div>
                )}
            </div>

            {isGuideOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">つくる〜との使い方</h2>

                            <button
                                onClick={() => setIsGuideOpen(false)}
                                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 text-sm leading-7 text-slate-700">
                            <div>
                                <h3 className="font-bold text-slate-900">1. プロジェクト作成</h3>
                                <p>
                                    右上の「＋新規プロジェクト」から，管理したい制作プロジェクトを作成します。
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900">2. タスク追加</h3>
                                <p>
                                    「＋タスク追加」から，タスク名，担当者，開始日，実働日数，進捗率を入力します。
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900">3. 実働日設定</h3>
                                <p>
                                    「すべての日」「平日のみ」「土日だけ」「カスタム」から，タスクごとの作業日を設定できます。
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900">4. 検索・並び替え</h3>
                                <p>
                                    設定を開くと，カテゴリ絞り込み，検索，並び替え，表示サイズ変更ができます。
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900">5. 入出力</h3>
                                <p>
                                    「入出力」から，JSONバックアップ，JSON読み込み，Excel出力ができます。
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900">6. 保存について</h3>
                                <p>
                                    データはブラウザ内に自動保存されます。別PCで使う場合はJSON出力・読込を使ってください。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isTermsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                利用規約
                            </h2>

                            <button
                                onClick={() =>
                                    setIsTermsOpen(false)
                                }
                                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 text-sm leading-7 text-slate-700">
                            <div>
                                <h3 className="font-bold text-slate-900">
                                    1. 免責事項
                                </h3>

                                <p>
                                    本ソフトウェア「つくる〜と」の使用によって発生した損害について，
                                    開発者は一切責任を負いません。
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900">
                                    2. データについて
                                </h3>

                                <p>
                                    保存データの消失や破損に備え，
                                    JSON出力などによるバックアップを推奨します。
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900">
                                    3. 再配布について
                                </h3>

                                <p>
                                    本ソフトウェアの無断転載・再配布・販売を禁止します。
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900">
                                    4. アップデート
                                </h3>

                                <p>
                                    本ソフトウェアは予告なく仕様変更・アップデートを行う場合があります。
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900">
                                    5. フィードバック
                                </h3>

                                <p>
                                    意見・要望フォームから送信された内容は，
                                    開発改善のために利用する場合があります。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}