import React, { useState, useEffect, useRef } from 'react';
import Transcription from './Transcription';
import Translation from './Translation';

export default function Information(props) {
    const { output, finished } = props;
    const [tab, setTab] = useState('transcription');
    const [translation, setTranslation] = useState(null);
    const [toLanguage, setToLanguage] = useState('Select language');
    const [translating, setTranslating] = useState(null);

    const worker = useRef();

    useEffect(() => {
        if (!worker.current) {
            worker.current = new Worker(new URL('../utils/translate.worker.js', import.meta.url), {
                type: 'module'
            });
        }

        const onMessageReceived = async (e) => {
            switch (e.data.status) {
                case 'initiate':
                    console.log('DOWNLOADING');
                    break;
                case 'progress':
                    console.log('LOADING');
                    break;
                case 'update':
                    setTranslation(e.data.output);
                    console.log(e.data.output);
                    break;
                case 'complete':
                    setTranslating(false);
                    console.log("DONE");
                    break;
            }
        };

        worker.current.addEventListener('message', onMessageReceived);

        return () => worker.current.removeEventListener('message', onMessageReceived);
    }, []); // Adicione a dependência para evitar efeitos colaterais

    const textElement = tab === 'transcription' 
        ? output?.text || '' // Acesse a propriedade text diretamente
        : translation || '';

    function handleCopy() {
        navigator.clipboard.writeText(textElement);
    }

    function handleDownload() {
        const element = document.createElement("a");
        const file = new Blob([textElement], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `Freescribe_${new Date().toString()}.txt`;
        document.body.appendChild(element);
        element.click();
    }

    function generateTranslation() {
        if (translating || toLanguage === 'Select language') {
            return;
        }

        setTranslating(true);

        worker.current.postMessage({
            text: output.text, // Use output.text em vez de um array
            src_lang: 'eng_Latn',
            tgt_lang: toLanguage
        });
    }

    return (
        <main className='flex-1 p-4 flex flex-col gap-3 text-center sm:gap-4 justify-center pb-20 max-w-prose w-full mx-auto'>
            <h1 className='font-semibold text-4xl sm:text-5xl md:text-6xl whitespace-nowrap'>Sua <span className='text-blue-400 bold'>Transcrição</span></h1>

            <div className='grid grid-cols-2 sm:mx-auto bg-white rounded overflow-hidden items-center p-1 blueShadow border-[2px] border-solid border-blue-300'>
                <button onClick={() => setTab('transcription')} className={'px-4 rounded duration-200 py-1 ' + (tab === 'transcription' ? ' bg-blue-300 text-white' : ' text-blue-400 hover:text-blue-600')}>Transcrição</button>
                <button onClick={() => setTab('translation')} className={'px-4 rounded duration-200 py-1  ' + (tab === 'translation' ? ' bg-blue-300 text-white' : ' text-blue-400 hover:text-blue-600')}>Tradução</button>
            </div>

            <div className='my-8 flex flex-col-reverse max-w-prose w-full mx-auto gap-4'>
                {(!finished || translating) && (
                    <div className='grid place-items-center'>
                        <i className="fa-solid fa-spinner animate-spin"></i>
                    </div>
                )}
                {tab === 'transcription' ? (
                    <Transcription textElement={textElement} />
                ) : (
                    <Translation {...props} toLanguage={toLanguage} translating={translating} textElement={textElement} setTranslating={setTranslating} setTranslation={setTranslation} setToLanguage={setToLanguage} generateTranslation={generateTranslation} />
                )}
            </div>

            <div className='flex items-center gap-4 mx-auto '>
                <button onClick={handleCopy} title="Copy" className='bg-white hover:text-blue-500 duration-200 text-blue-300 px-2 aspect-square grid place-items-center rounded'>
                    <i className="fa-solid fa-copy"></i>
                </button>
                <button onClick={handleDownload} title="Download" className='bg-white hover:text-blue-500 duration-200 text-blue-300 px-2 aspect-square grid place-items-center rounded'>
                    <i className="fa-solid fa-download"></i>
                </button>
            </div>
        </main>
    );
}
