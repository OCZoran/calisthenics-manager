import React, { useState, useEffect } from "react";
import {
	Plus,
	TrendingUp,
	TrendingDown,
	Minus,
	Image as LucideImage,
	FileText,
	X,
} from "lucide-react";
import Image from "next/image";

type Update = {
	id: number;
	date: string;
	notes: string;
	status: "progress" | "neutral" | "regress";
	images: string[];
	feeling: number;
};

type Goal = {
	id: number;
	title: string;
	category: string;
	description: string;
	startDate: string;
	updates: Update[];
	status: string;
};

type NewGoal = {
	title: string;
	category: string;
	description: string;
	startDate: string;
};

type NewUpdate = {
	notes: string;
	status: "progress" | "neutral" | "regress";
	images: string[];
	feeling: number;
};

type ModalProps = {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	gradient?: boolean;
	maxWidth?: string;
};

// Reusable Modal Component
const Modal = ({
	isOpen,
	onClose,
	title,
	children,
	gradient = false,
	maxWidth = "max-w-2xl",
}: ModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div
				className={`bg-white rounded-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}
			>
				<div
					className={`sticky top-0 px-6 py-4 flex items-center justify-between ${
						gradient
							? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
							: "bg-white border-b border-gray-200"
					}`}
				>
					<h2
						className={`text-2xl font-bold ${
							gradient ? "text-white" : "text-gray-800"
						}`}
					>
						{title}
					</h2>
					<button
						onClick={onClose}
						className={
							gradient
								? "text-white/80 hover:text-white"
								: "text-gray-400 hover:text-gray-600"
						}
					>
						<X size={24} />
					</button>
				</div>
				{children}
			</div>
		</div>
	);
};

// Status Button Config
const STATUS_CONFIG = {
	progress: { label: "Napredujem", icon: TrendingUp, color: "green" },
	neutral: { label: "Neutralno", icon: Minus, color: "gray" },
	regress: { label: "Nazadujem", icon: TrendingDown, color: "red" },
};

const CATEGORIES = [
	"Fleksibilnost",
	"Mobilnost",
	"Vještina",
	"Snaga",
	"Kilaza",
	"Ponavljanja",
	"Izdržljivost",
	"Drugo",
];

const GoalTracker = () => {
	const [goals, setGoals] = useState<Goal[]>([]);
	const [showNewGoal, setShowNewGoal] = useState<boolean>(false);
	const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
	const [showUpdate, setShowUpdate] = useState<boolean>(false);

	const [newGoal, setNewGoal] = useState<NewGoal>({
		title: "",
		category: "",
		description: "",
		startDate: new Date().toISOString().split("T")[0],
	});

	const [newUpdate, setNewUpdate] = useState<NewUpdate>({
		notes: "",
		status: "neutral",
		images: [],
		feeling: 3,
	});

	// Cleanup image URLs on unmount
	useEffect(() => {
		return () => {
			newUpdate.images.forEach((url) => URL.revokeObjectURL(url));
		};
	}, [newUpdate.images]);

	const createGoal = () => {
		if (!newGoal.title || !newGoal.category) return;

		const goal: Goal = {
			id: Date.now(),
			...newGoal,
			updates: [],
			status: "in-progress",
		};

		setGoals([...goals, goal]);
		setNewGoal({
			title: "",
			category: "",
			description: "",
			startDate: new Date().toISOString().split("T")[0],
		});
		setShowNewGoal(false);
	};

	const addUpdate = () => {
		if (!selectedGoal) return;

		const update: Update = {
			id: Date.now(),
			date: new Date().toISOString().split("T")[0],
			...newUpdate,
		};

		const updatedGoals = goals.map((g) =>
			g.id === selectedGoal.id ? { ...g, updates: [...g.updates, update] } : g
		);

		setGoals(updatedGoals);
		setNewUpdate({ notes: "", status: "neutral", images: [], feeling: 3 });
		setShowUpdate(false);
		setSelectedGoal(updatedGoals.find((g) => g.id === selectedGoal.id) ?? null);
	};

	const getProgressStats = (goal: Goal) => {
		const total = goal.updates.length;
		const positive = goal.updates.filter((u) => u.status === "progress").length;
		const negative = goal.updates.filter((u) => u.status === "regress").length;
		return {
			total,
			positive,
			negative,
			percentage: total > 0 ? Math.round((positive / total) * 100) : 0,
		};
	};

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		const imageUrls = files.map((file) => URL.createObjectURL(file));
		setNewUpdate({ ...newUpdate, images: [...newUpdate.images, ...imageUrls] });
	};

	const removeImage = (index: number) => {
		const urlToRevoke = newUpdate.images[index];
		URL.revokeObjectURL(urlToRevoke);
		setNewUpdate({
			...newUpdate,
			images: newUpdate.images.filter((_, idx) => idx !== index),
		});
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
			{/* Header */}
			<div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
								Otključaj Nešto Novo
							</h1>
							<p className="text-gray-600 mt-1">
								Prati svoj napredak i postani bolji svaki dan
							</p>
						</div>
						<button
							onClick={() => setShowNewGoal(true)}
							className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
						>
							<Plus size={20} />
							Novi Cilj
						</button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{goals.length === 0 ? (
					<div className="text-center py-20">
						<div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
							<TrendingUp size={40} className="text-indigo-600" />
						</div>
						<h3 className="text-2xl font-semibold text-gray-800 mb-2">
							Započni svoje putovanje
						</h3>
						<p className="text-gray-600 mb-6">
							Dodaj prvi cilj i počni pratiti svoj napredak
						</p>
						<button
							onClick={() => setShowNewGoal(true)}
							className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
						>
							<Plus size={20} />
							Dodaj Cilj
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{goals.map((goal) => {
							const stats = getProgressStats(goal);
							const lastUpdate = goal.updates[goal.updates.length - 1];

							return (
								<div
									key={goal.id}
									onClick={() => setSelectedGoal(goal)}
									className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100"
								>
									{/* Goal Header */}
									<div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
										<div className="flex items-start justify-between mb-2">
											<span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
												{goal.category}
											</span>
											<span className="text-xs opacity-80">
												{goal.updates.length} unosa
											</span>
										</div>
										<h3 className="text-xl font-bold mt-3 mb-2">
											{goal.title}
										</h3>
										<p className="text-sm text-indigo-100">
											Početak: {goal.startDate}
										</p>
									</div>

									{/* Progress Bar */}
									<div className="px-6 pt-4">
										<div className="flex items-center justify-between text-sm mb-2">
											<span className="text-gray-600">Napredak</span>
											<span className="font-semibold text-indigo-600">
												{stats.percentage}%
											</span>
										</div>
										<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
											<div
												className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
												style={{ width: `${stats.percentage}%` }}
											/>
										</div>
									</div>

									{/* Stats */}
									<div className="px-6 py-4 flex gap-4">
										<div className="flex items-center gap-2 text-green-600">
											<TrendingUp size={16} />
											<span className="text-sm font-semibold">
												{stats.positive}
											</span>
										</div>
										<div className="flex items-center gap-2 text-red-600">
											<TrendingDown size={16} />
											<span className="text-sm font-semibold">
												{stats.negative}
											</span>
										</div>
										<div className="flex items-center gap-2 text-gray-600">
											<Minus size={16} />
											<span className="text-sm font-semibold">
												{stats.total - stats.positive - stats.negative}
											</span>
										</div>
									</div>

									{/* Last Update Preview */}
									{lastUpdate && (
										<div className="px-6 pb-4">
											<div className="bg-gray-50 rounded-lg p-3">
												<div className="flex items-center justify-between mb-2">
													<span className="text-xs text-gray-500">
														Posljednji unos
													</span>
													<span className="text-xs text-gray-500">
														{lastUpdate.date}
													</span>
												</div>
												{lastUpdate.images.length > 0 && (
													<Image
														src={lastUpdate.images[0]}
														alt="Progress"
														className="w-full h-24 object-cover rounded mb-2"
													/>
												)}
												<p className="text-sm text-gray-700 line-clamp-2">
													{lastUpdate.notes}
												</p>
											</div>
										</div>
									)}

									<div className="px-6 pb-4">
										<button
											onClick={(e) => {
												e.stopPropagation();
												setSelectedGoal(goal);
												setShowUpdate(true);
											}}
											className="w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg hover:bg-indigo-100 transition flex items-center justify-center gap-2 font-medium"
										>
											<Plus size={16} />
											Dodaj Update
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* New Goal Modal */}
			<Modal
				isOpen={showNewGoal}
				onClose={() => setShowNewGoal(false)}
				title="Novi Cilj"
			>
				<div className="p-6 space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Naslov
						</label>
						<input
							type="text"
							value={newGoal.title}
							onChange={(e) =>
								setNewGoal({ ...newGoal, title: e.target.value })
							}
							placeholder="npr. Spust u puni špagate"
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Kategorija
						</label>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
							{CATEGORIES.map((cat) => (
								<button
									key={cat}
									onClick={() => setNewGoal({ ...newGoal, category: cat })}
									className={`px-4 py-2 rounded-lg border-2 transition ${
										newGoal.category === cat
											? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
											: "border-gray-200 hover:border-indigo-300"
									}`}
								>
									{cat}
								</button>
							))}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Opis / Savjeti
						</label>
						<textarea
							value={newGoal.description}
							onChange={(e) =>
								setNewGoal({ ...newGoal, description: e.target.value })
							}
							placeholder="Dodaj napomene, savjete ili plan..."
							rows={4}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Datum početka
						</label>
						<input
							type="date"
							value={newGoal.startDate}
							onChange={(e) =>
								setNewGoal({ ...newGoal, startDate: e.target.value })
							}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						/>
					</div>

					<div className="flex gap-3 pt-4">
						<button
							onClick={() => setShowNewGoal(false)}
							className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
						>
							Otkaži
						</button>
						<button
							onClick={createGoal}
							disabled={!newGoal.title || !newGoal.category}
							className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Kreiraj Cilj
						</button>
					</div>
				</div>
			</Modal>

			{/* Goal Details Modal */}
			{selectedGoal && !showUpdate && (
				<Modal
					isOpen={true}
					onClose={() => setSelectedGoal(null)}
					title=""
					gradient={true}
					maxWidth="max-w-4xl"
				>
					<div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-6 -mt-16">
						<div className="flex items-start justify-between">
							<div>
								<span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
									{selectedGoal.category}
								</span>
								<h2 className="text-2xl font-bold mt-3">
									{selectedGoal.title}
								</h2>
								<p className="text-indigo-100 mt-1">
									Početak: {selectedGoal.startDate}
								</p>
							</div>
							<button
								onClick={() => setSelectedGoal(null)}
								className="text-white/80 hover:text-white"
							>
								<X size={24} />
							</button>
						</div>
					</div>

					{selectedGoal.description && (
						<div className="px-6 py-4 bg-gray-50 border-b">
							<p className="text-gray-700">{selectedGoal.description}</p>
						</div>
					)}

					<div className="p-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-semibold text-gray-800">
								Timeline ({selectedGoal.updates.length})
							</h3>
							<button
								onClick={() => setShowUpdate(true)}
								className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
							>
								<Plus size={16} />
								Dodaj Update
							</button>
						</div>

						{selectedGoal.updates.length === 0 ? (
							<div className="text-center py-12 text-gray-500">
								<FileText size={48} className="mx-auto mb-4 text-gray-300" />
								<p>Još nema unosa. Dodaj prvi update!</p>
							</div>
						) : (
							<div className="space-y-4">
								{[...selectedGoal.updates].reverse().map((update) => {
									const config = STATUS_CONFIG[update.status];
									const Icon = config.icon;
									const colorClasses = {
										green: "bg-green-100 text-green-600",
										red: "bg-red-100 text-red-600",
										gray: "bg-gray-100 text-gray-600",
									};

									return (
										<div
											key={update.id}
											className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition"
										>
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-3">
													<div
														className={`w-10 h-10 rounded-full flex items-center justify-center ${
															colorClasses[
																config.color as keyof typeof colorClasses
															]
														}`}
													>
														<Icon size={20} />
													</div>
													<div>
														<p className="font-medium text-gray-800">
															{config.label}
														</p>
														<p className="text-sm text-gray-500">
															{update.date}
														</p>
													</div>
												</div>
												<div className="flex gap-1">
													{[...Array(5)].map((_, i) => (
														<div
															key={i}
															className={`w-2 h-2 rounded-full ${
																i < update.feeling
																	? "bg-yellow-400"
																	: "bg-gray-300"
															}`}
														/>
													))}
												</div>
											</div>

											{update.images.length > 0 && (
												<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
													{update.images.map((img, i) => (
														<Image
															key={i}
															src={img}
															alt=""
															className="w-full h-32 object-cover rounded-lg"
														/>
													))}
												</div>
											)}

											{update.notes && (
												<p className="text-gray-700 bg-white p-3 rounded-lg">
													{update.notes}
												</p>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</Modal>
			)}

			{/* Add Update Modal */}
			<Modal
				isOpen={showUpdate && !!selectedGoal}
				onClose={() => setShowUpdate(false)}
				title="Novi Update"
			>
				<div className="p-6 space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Status
						</label>
						<div className="grid grid-cols-3 gap-3">
							{Object.entries(STATUS_CONFIG).map(
								([value, { label, icon: Icon, color }]) => {
									const isSelected = newUpdate.status === value;
									const colorClasses = {
										green: isSelected
											? "border-green-500 bg-green-50 text-green-700"
											: "",
										red: isSelected
											? "border-red-500 bg-red-50 text-red-700"
											: "",
										gray: isSelected
											? "border-gray-500 bg-gray-50 text-gray-700"
											: "",
									};
									const iconClasses = {
										green: isSelected ? "text-green-600" : "text-gray-400",
										red: isSelected ? "text-red-600" : "text-gray-400",
										gray: isSelected ? "text-gray-600" : "text-gray-400",
									};

									return (
										<button
											key={value}
											onClick={() =>
												setNewUpdate({
													...newUpdate,
													status: value as "progress" | "neutral" | "regress",
												})
											}
											className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
												isSelected
													? colorClasses[color as keyof typeof colorClasses]
													: "border-gray-200 hover:border-gray-300"
											}`}
										>
											<Icon
												size={24}
												className={
													iconClasses[color as keyof typeof iconClasses]
												}
											/>
											<span
												className={`text-sm font-medium ${
													isSelected ? "" : "text-gray-600"
												}`}
											>
												{label}
											</span>
										</button>
									);
								}
							)}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Osjećaj (1-5)
						</label>
						<div className="flex gap-2">
							{[1, 2, 3, 4, 5].map((num) => (
								<button
									key={num}
									onClick={() => setNewUpdate({ ...newUpdate, feeling: num })}
									className={`flex-1 py-3 rounded-lg border-2 transition font-semibold ${
										newUpdate.feeling === num
											? "border-yellow-400 bg-yellow-50 text-yellow-700"
											: "border-gray-200 hover:border-yellow-300"
									}`}
								>
									{num}
								</button>
							))}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Slike / Video
						</label>
						<input
							type="file"
							accept="image/*,video/*"
							multiple
							onChange={handleImageUpload}
							className="hidden"
							id="image-upload"
						/>
						<label
							htmlFor="image-upload"
							className="flex items-center justify-center gap-2 w-full p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 cursor-pointer transition bg-gray-50 hover:bg-indigo-50"
						>
							<LucideImage size={24} className="text-gray-400" />
							<span className="text-gray-600">Dodaj slike ili video</span>
						</label>
						{newUpdate.images.length > 0 && (
							<div className="grid grid-cols-3 gap-2 mt-3">
								{newUpdate.images.map((img, i) => (
									<div key={i} className="relative">
										<Image
											src={img}
											alt=""
											className="w-full h-24 object-cover rounded-lg"
										/>
										<button
											onClick={() => removeImage(i)}
											className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
										>
											<X size={14} />
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Napomene
						</label>
						<textarea
							value={newUpdate.notes}
							onChange={(e) =>
								setNewUpdate({ ...newUpdate, notes: e.target.value })
							}
							placeholder="Kako se osjećaš? Šta si danas radio?"
							rows={4}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						/>
					</div>

					<div className="flex gap-3 pt-4">
						<button
							onClick={() => setShowUpdate(false)}
							className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
						>
							Otkaži
						</button>
						<button
							onClick={addUpdate}
							className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
						>
							Dodaj Update
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default GoalTracker;
