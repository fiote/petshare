import { MigrationInterface, QueryRunner } from 'typeorm';

const LABEL_TO_KEY : Array<[string, string]> = [
	['Abelha', 'bee'],
	['Aranha', 'spider'],
	['Borboleta', 'butterfly'],
	['Cabra', 'goat'],
	['Cachorro', 'dog'],
	['Camarão', 'shrimp'],
	['Caranguejo', 'crab'],
	['Cavalo', 'horse'],
	['Chinchila', 'chinchilla'],
	['Cobra', 'snake'],
	['Coelho', 'rabbit'],
	['Coruja', 'owl'],
	['Esquilo', 'squirrel'],
	['Furão', 'ferret'],
	['Galinha', 'chicken'],
	['Gato', 'cat'],
	['Hamster', 'hamster'],
	['Lagarto', 'lizard'],
	['Morcego', 'bat'],
	['Ouriço', 'hedgehog'],
	['Ovelha', 'sheep'],
	['Papagaio', 'parrot'],
	['Pássaro', 'bird'],
	['Pato', 'duck'],
	['Pavão', 'peacock'],
	['Peixe', 'fish'],
	['Pinguim', 'penguin'],
	['Polvo', 'octopus'],
	['Porco', 'pig'],
	['Porquinho-da-índia', 'guineaPig'],
	['Rato/Camundongo', 'mouse'],
	['Sapo/Rã', 'frog'],
	['Tartaruga', 'turtle'],
	['Vaca', 'cow']
];

export class SpeciesLabelToKey1784924053776 implements MigrationInterface {

	public async up(queryRunner: QueryRunner): Promise<void> {
		for (const [label, key] of LABEL_TO_KEY) {
			await queryRunner.query('UPDATE "pets" SET "species" = $1 WHERE "species" = $2', [key, label]);
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		for (const [label, key] of LABEL_TO_KEY) {
			await queryRunner.query('UPDATE "pets" SET "species" = $1 WHERE "species" = $2', [label, key]);
		}
	}

}
