import {
	LanguageDetectorApi,
	PromptApi,
	ProofreaderApi,
	RewriterApi,
	SummarizerApi,
	TranslatorApi,
	WriterApi,
} from './tools';

const BuiltInAITools = () => {
	return (
		<div className="w-full">
			<PromptApi />
			<WriterApi />
			<RewriterApi />
			<ProofreaderApi />
			<TranslatorApi />
			<LanguageDetectorApi />
			<SummarizerApi />
		</div>
	);
};

export default BuiltInAITools;
