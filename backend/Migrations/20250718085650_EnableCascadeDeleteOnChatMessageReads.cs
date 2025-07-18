using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class EnableCascadeDeleteOnChatMessageReads : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessageReads_User_UserId",
                table: "ChatMessageReads");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessageReads_User_UserId",
                table: "ChatMessageReads",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessageReads_User_UserId",
                table: "ChatMessageReads");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessageReads_User_UserId",
                table: "ChatMessageReads",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id");
        }
    }
}
